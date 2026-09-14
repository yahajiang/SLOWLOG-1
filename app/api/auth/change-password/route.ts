import { NextRequest, NextResponse } from "next/server"
import { apiError } from "@/lib/api-utils"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return apiError(401, "未登录")

  const body = await req.json()
  const email = (body.email as string)?.toLowerCase().trim()
  const password = body.password as string
  const confirmPassword = body.confirmPassword as string | undefined
  const name = (body.name as string)?.trim()
  const currentPassword = body.currentPassword as string

  if (!currentPassword || !email || !password || !name) {
    return NextResponse.json({ error: "请填写所有字段" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "密码至少 8 位" }, { status: 400 })
  }
  if (confirmPassword !== undefined && confirmPassword !== password) {
    return NextResponse.json({ error: "两次输入的密码不一致" }, { status: 400 })
  }
  if (!email.includes("@")) {
    return NextResponse.json({ error: "请输入有效邮箱" }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } })
    if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    // 当前密码验证：持会话不等于持凭据，改密必须复核身份
    const currentOk = await bcrypt.compare(currentPassword, user.password)
    if (!currentOk) return NextResponse.json({ error: "当前密码不正确" }, { status: 403 })
    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { email, password: hashed, name },
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
