import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const ALLOWED_FIELDS = ["name", "nameZh", "slug", "description", "descriptionZh", "coverImageUrl"] as const

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const data: any = {}
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key]
  }
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "无有效字段" }, { status: 400 })
  try {
    const cat = await prisma.category.update({ where: { id }, data })
    return NextResponse.json(cat)
  } catch (e: any) {
    if (e.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (e.code === "P2002") return NextResponse.json({ error: "Slug 已存在" }, { status: 400 })
    console.error(e)
    return NextResponse.json({ error: "更新失败" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  try {
    // 检查分类下是否有文章
    const count = await prisma.post.count({ where: { categoryId: id } })
    if (count > 0) return NextResponse.json({ error: `该分类下有 ${count} 篇文章，无法删除` }, { status: 400 })
    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 })
    console.error(e)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
