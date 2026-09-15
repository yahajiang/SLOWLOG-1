import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// 健康检查（v0.3 P0-5）：DB 真实探测 + Blob 配置检查。
// 200 = 全部正常；503 = 有组件降级（DB 不可达等）。
//
// P3-2：对外只暴露 `status`。原先公开返回的 `checks` 会泄漏数据库查询延迟
// （可据以推断负载与 DB 位置）以及 Blob 是否已配置（部署侧情报）。
// 详细诊断仅对已登录管理员开放。
export const dynamic = "force-dynamic"

export async function GET() {
  const checks: Record<string, string> = {}
  let ok = true

  const started = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.db = `ok (${Date.now() - started}ms)`
  } catch {
    checks.db = "unreachable"
    ok = false
  }

  checks.blob = process.env.BLOB_READ_WRITE_TOKEN ? "configured" : "not-configured"
  checks.searchIndex = "runtime"

  let isAdmin = false
  try {
    isAdmin = !!(await auth())
  } catch {
    // 健康检查不应因鉴权层自身异常而失败
  }

  return NextResponse.json(
    isAdmin
      ? { status: ok ? "ok" : "degraded", checks, time: new Date().toISOString() }
      : { status: ok ? "ok" : "degraded" },
    { status: ok ? 200 : 503 }
  )
}
