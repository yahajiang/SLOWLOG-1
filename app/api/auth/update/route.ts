import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: "未登录" }, { status: 401 })
  const body = await req.json()
  const { username, password, name } = body
  if (!username || !password || !name) return NextResponse.json({ error: "请填写所有字段" }, { status: 400 })
  // username is email prefix or full email; normalize to lowercase so login lookup (which lowercases input) always matches
  const email = (username.includes("@") ? username : `${username}@slowlog.dev`).toLowerCase().trim()
  const hash = await bcrypt.hash(password, 10)
  try {
    const currentEmail = (session.user as any).email
    const user = await prisma.user.findUnique({ where: { email: currentEmail } })
    if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    await prisma.user.update({ where: { id: user.id }, data: { email, password: hash, name } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "邮箱已存在" }, { status: 400 })
    console.error(e)
    return NextResponse.json({ error: "更新失败" }, { status: 500 })
  }
}
