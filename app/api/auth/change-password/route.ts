import { NextRequest, NextResponse } from "next/server"
import { apiError, apiZodError } from "@/lib/api-utils"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { changePasswordSchema } from "@/lib/schemas"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return apiError(401, "未登录")

  // P3-3：改用 lib/schemas.ts 的共享 changePasswordSchema。
  // 此前路由内手写了一套等价校验，与 schema 定义长期存在漂移风险
  // （改了 schema 忘记同步路由，或反之）。
  const parsed = changePasswordSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return apiZodError(parsed.error)
  const { currentPassword, email, password, name } = parsed.data

  try {
    const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } })
    if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    // 当前密码验证：持会话不等于持凭据，改密必须复核身份
    const currentOk = await bcrypt.compare(currentPassword, user.password)
    if (!currentOk) return NextResponse.json({ error: "当前密码不正确" }, { status: 403 })
    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { email: email.toLowerCase(), password: hashed, name },
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "该邮箱已被使用" }, { status: 400 })
    }
    console.error(e)
    return apiError(500, "修改失败")
  }
}
