import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import { passwordChangeRequired } from "@/lib/auth"
import { apiError, apiZodError } from "@/lib/api-utils"
import { tokenCreateSchema } from "@/lib/schemas"
import { prisma } from "@/lib/prisma"
import { requireSessionOrBearer, sha256Hex } from "@/lib/app-auth"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  // App 端用 Bearer 调不通此前的 await auth()，故改为与 devices/categories/settings
  // 一致的 requireSessionOrBearer。强制改密仍只作用于 session 分支。
  const gate = await requireSessionOrBearer(req)
  if (!gate) return apiError(401, "未登录")
  if (gate.kind === "session" && passwordChangeRequired(gate.session)) return apiError(403, "请先修改默认密码")
  const rows = await prisma.apiToken.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, createdAt: true, lastUsedAt: true, revokedAt: true },
  })
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const gate = await requireSessionOrBearer(req)
  if (!gate) return apiError(401, "未登录")
  if (gate.kind === "session" && passwordChangeRequired(gate.session)) return apiError(403, "请先修改默认密码")
  const parsed = tokenCreateSchema.safeParse(await req.json())
  if (!parsed.success) return apiZodError(parsed.error)
  const token = randomBytes(32).toString("hex")
  const row = await prisma.apiToken.create({
    data: { name: parsed.data.name, tokenHash: sha256Hex(token) },
    select: { id: true, name: true, createdAt: true },
  })
  return NextResponse.json({ ...row, token })
}

export async function DELETE(req: NextRequest) {
  const gate = await requireSessionOrBearer(req)
  if (!gate) return apiError(401, "未登录")
  if (gate.kind === "session" && passwordChangeRequired(gate.session)) return apiError(403, "请先修改默认密码")
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return apiError(400, "缺少 id")
  // 自毁保护：不允许用某个 token 撤销它自己，否则 App 会在下一次请求静默失效
  if (gate.kind === "bearer" && gate.tokenId === id) return apiError(400, "不能撤销当前正在使用的令牌")
  try {
    const r = await prisma.apiToken.updateMany({ where: { id, revokedAt: null }, data: { revokedAt: new Date() } })
    if (r.count === 0) return apiError(404, "令牌不存在或已撤销")
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return apiError(500, "撤销失败")
  }
}
