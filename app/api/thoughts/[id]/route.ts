import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { apiError } from "@/lib/api-utils"
import { passwordChangeRequired } from "@/lib/auth"
import { adminAuthError, requireAdminAuth } from "@/lib/app-auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const note = await prisma.note.findUnique({ where: { id } })
  if (!note) return apiError(404, "随想不存在")
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
  const gate = await requireAdminAuth(req)
  if (!gate.ok) return adminAuthError(gate.reason)
  if (gate.kind === "session" && passwordChangeRequired(gate.session)) return apiError(403, "请先修改默认密码")
  const { id } = await params
  const body = await req.json()
  const text = body.textZh || body.text || body.content || ""
  if (!text || text.length > 500) return NextResponse.json({ error: "内容需 1-500 字" }, { status: 400 })
  try {
    const note = await prisma.note.update({ where: { id }, data: { content: text, contentZh: body.textZh || text } })
    revalidateTag("thoughts")
    return NextResponse.json({ id: note.id, text: note.content, textZh: note.contentZh, createdAt: note.createdAt })
  } catch (e: any) {
    if (e.code === "P2025") return apiError(404, "随想不存在")
    console.error(e)
    return NextResponse.json({ error: "更新失败" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminAuth(req)
  if (!gate.ok) return adminAuthError(gate.reason)
  if (gate.kind === "session" && passwordChangeRequired(gate.session)) return apiError(403, "请先修改默认密码")
  const { id } = await params
  try {
    await prisma.note.delete({ where: { id } })
    revalidateTag("thoughts")
    revalidatePath("/")
    revalidatePath("/m")
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e.code === "P2025") return apiError(404, "随想不存在")
    console.error(e)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
