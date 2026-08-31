import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const email = (body.email as string)?.toLowerCase().trim()
  const password = body.password as string
  const name = (body.name as string)?.trim()

  if (!email || !password || !name) {
    return NextResponse.json({ error: "请填写所有字段" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "密码至少 8 位" }, { status: 400 })
  }
  if (!email.includes("@")) {
    return NextResponse.json({ error: "请输入有效邮箱" }, { status: 400 })
  }

  try {
    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: { email, password: hashed, name },
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "该邮箱已被使用" }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: "修改失败" }, { status: 500 })
  }
}
