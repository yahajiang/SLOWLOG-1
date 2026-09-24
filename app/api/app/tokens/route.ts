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
      // 归属账号（2026-09-25）：这一页此前只看得见令牌标签，看不出是谁的凭据，
      // 撤销只能靠猜；App 自助注册放开后更会出现一串陌生邮箱的只读令牌。
      // `user: null` = 本次改动之前签发的历史令牌（当时表里根本没有归属字段）。
      user: { select: { email: true, name: true, role: true } },
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
  // 手动创建的令牌同样记归属：会话创建 ⇒ 记这个会话的账号；Bearer 创建 ⇒
  // 记那枚管理令牌的归属账号（历史令牌没有归属，记 null，列表里显示为「无归属」）。
  const userId =
    gate.kind === "session" ? ((gate.session.user as { id?: string }).id ?? null) : gate.userId
  const row = await prisma.apiToken.create({
    data: {
      name: parsed.data.name,
      tokenHash: sha256Hex(token),
      scope,
      expiresAt: tokenExpiry(scope),
      userId,
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
