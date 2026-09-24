import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import { passwordChangeRequired } from "@/lib/auth"
import { apiError, apiZodError } from "@/lib/api-utils"
import { tokenCreateSchema } from "@/lib/schemas"
import { prisma } from "@/lib/prisma"
import { adminAuthError, requireAdminAuth, sha256Hex, tokenExpiry } from "@/lib/app-auth"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  // 令牌管理属后台操作 ⇒ 要求管理凭据（scope=admin）或 Web 会话；
  // 同步凭据（scope=sync）到这里会 403，不会列出本站的令牌。
  // 强制改密仍只作用于 session 分支。
  const gate = await requireAdminAuth(req)
  if (!gate.ok) return adminAuthError(gate.reason)
  if (gate.kind === "session" && passwordChangeRequired(gate.session)) return apiError(403, "请先修改默认密码")
  const rows = await prisma.apiToken.findMany({
    orderBy: { createdAt: "desc" },
    // scope / expiresAt 必须回显：App 令牌页要能一眼看出「哪枚能改站点、
    // 哪枚只剩只读」以及「哪枚快到期了」。只返 id/name 会让用户没法
    // 区分自己手上这两枚凭据，撤销时也就只能靠猜。
    select: {
      id: true,
      name: true,
      scope: true,
      expiresAt: true,
      createdAt: true,
      lastUsedAt: true,
      revokedAt: true,
    },
  })
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminAuth(req)
  if (!gate.ok) return adminAuthError(gate.reason)
  if (gate.kind === "session" && passwordChangeRequired(gate.session)) return apiError(403, "请先修改默认密码")
  const parsed = tokenCreateSchema.safeParse(await req.json())
  if (!parsed.success) return apiZodError(parsed.error)
  const token = randomBytes(32).toString("hex")
  const scope = parsed.data.scope
  const row = await prisma.apiToken.create({
    data: {
      name: parsed.data.name,
      tokenHash: sha256Hex(token),
      scope,
      expiresAt: tokenExpiry(scope),
    },
    select: { id: true, name: true, scope: true, expiresAt: true, createdAt: true },
  })
  return NextResponse.json({ ...row, token })
}

export async function DELETE(req: NextRequest) {
  const gate = await requireAdminAuth(req)
  if (!gate.ok) return adminAuthError(gate.reason)
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
