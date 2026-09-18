import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { apiError, apiZodError } from "@/lib/api-utils"
import { categoryUpdateSchema } from "@/lib/schemas"
import { passwordChangeRequired } from "@/lib/auth"
import { requireSessionOrBearer } from "@/lib/app-auth"

const ALLOWED_FIELDS = ["name", "nameZh", "slug", "description", "descriptionZh", "coverImageUrl"] as const

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireSessionOrBearer(req)
  if (!gate) return apiError(401, "未登录")
  if (gate.kind === "session" && passwordChangeRequired(gate.session)) return apiError(403, "请先修改默认密码")
  const { id } = await params
  const parsed = categoryUpdateSchema.safeParse(await req.json())
  if (!parsed.success) return apiZodError(parsed.error)
  const body = parsed.data
  const data: any = {}
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key]
  }
  if (Object.keys(data).length === 0) return apiError(400, "无有效字段")
  try {
    const cat = await prisma.category.update({ where: { id }, data })
    revalidateTag("categories")
    return NextResponse.json(cat)
  } catch (e: any) {
    if (e.code === "P2025") return apiError(404, "分类不存在")
    if (e.code === "P2002") return apiError(400, "Slug 已存在")
    console.error(e)
    return apiError(500, "更新失败")
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireSessionOrBearer(req)
  if (!gate) return apiError(401, "未登录")
  if (gate.kind === "session" && passwordChangeRequired(gate.session)) return apiError(403, "请先修改默认密码")
  const { id } = await params
  try {
    // 检查分类下是否有文章
    const count = await prisma.post.count({ where: { categoryId: id } })
    if (count > 0) return apiError(400, `该分类下有 ${count} 篇文章，无法删除`)
    await prisma.category.delete({ where: { id } })
    revalidateTag("categories")
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e.code === "P2025") return apiError(404, "分类不存在")
    console.error(e)
    return apiError(500, "删除失败")
  }
}
