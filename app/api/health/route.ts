import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 健康检查（v0.3 P0-5）：DB 真实探测 + Blob 配置检查。
// 200 = 全部正常；503 = 有组件降级（DB 不可达等）。
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

  return NextResponse.json(
    { status: ok ? "ok" : "degraded", checks, time: new Date().toISOString() },
    { status: ok ? 200 : 503 }
  )
}
