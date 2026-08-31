import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const note = await prisma.note.findUnique({ where: { id } })
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({
    id: note.id,
    text: note.content,
    textZh: note.contentZh || note.content,
    content: note.content,
    contentZh: note.contentZh || note.content,
    createdAt: note.createdAt,
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const text = body.textZh || body.text || body.content || ""
  if (!text || text.length > 500) return NextResponse.json({ error: "内容需 1-500 字" }, { status: 400 })
  try {
    const note = await prisma.note.update({ where: { id }, data: { content: text, contentZh: body.textZh || text } })
    return NextResponse.json({ id: note.id, text: note.content, textZh: note.contentZh, createdAt: note.createdAt })
  } catch (e: any) {
    if (e.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 })
    console.error(e)
    return NextResponse.json({ error: "更新失败" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  try {
    await prisma.note.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 })
    console.error(e)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
