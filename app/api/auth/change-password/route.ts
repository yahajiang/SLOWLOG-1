import { NextRequest, NextResponse } from "next/server"
import { apiError, apiZodError } from "@/lib/api-utils"
import { adminAuthError, requireAdminAuth } from "@/lib/app-auth"
import { prisma } from "@/lib/prisma"
import { changePasswordSchema } from "@/lib/schemas"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  // 改密会**作废全部令牌**，是本站权限最高的动作之一 ⇒ 走管理门禁。
  // 此前这里只要求「一枚有效 Bearer」，也就是「邮箱密码自动获取的那枚只读
  // 同步凭据」也能改掉管理员的密码 —— 本次分级一并收掉。
  const gate = await requireAdminAuth(req)
  if (!gate.ok) return adminAuthError(gate.reason)

  let userId = gate.kind === "session" ? ((gate.session.user as any)?.id as string | undefined) : undefined
  if (!userId) {
    // App 管理凭据：单管理员站点，改密落到唯一 User；多用户时拒绝以免误改
    const users = await prisma.user.findMany({ take: 2, select: { id: true } })
    if (users.length !== 1) return apiError(403, "无法确定目标用户，请使用网页端改密")
    userId = users[0].id
  }

  // P3-3：改用 lib/schemas.ts 的共享 changePasswordSchema。
  // 此前路由内手写了一套等价校验，与 schema 定义长期存在漂移风险
  // （改了 schema 忘记同步路由，或反之）。
  const parsed = changePasswordSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return apiZodError(parsed.error)
  const { currentPassword, email, password, name } = parsed.data

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    // 当前密码验证：持会话不等于持凭据，改密必须复核身份
    const currentOk = await bcrypt.compare(currentPassword, user.password)
    if (!currentOk) return NextResponse.json({ error: "当前密码不正确" }, { status: 403 })
    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { email: email.toLowerCase(), password: hashed, name },
    })
    // 凭据轮换后作废全部 App Token（Bearer 不得活过密码变更）
    await prisma.apiToken.updateMany({ where: { revokedAt: null }, data: { revokedAt: new Date() } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "该邮箱已被使用" }, { status: 400 })
    }
    console.error(e)
    return apiError(500, "修改失败")
  }
}
