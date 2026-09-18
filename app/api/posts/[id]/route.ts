import { NextRequest, NextResponse } from "next/server"
import { auth, passwordChangeRequired } from "@/lib/auth"
import { apiError, apiZodError } from "@/lib/api-utils"
import { requireSessionOrBearer } from "@/lib/app-auth"
import { postUpdateSchema } from "@/lib/schemas"
import { prisma } from "@/lib/prisma"
import { isPublicPost, revalidatePostPaths } from "@/lib/posts"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const post =
    (await prisma.post.findUnique({ where: { id }, include: { category: true } })) ||
    // P3-25：与页面层（app/posts/[id]/page.tsx 的 `slug || id` 双兼容）对齐。
    // 旧实现只按 id 查询，导致同一地址「页面能打开、API 却 404」。
    (await prisma.post.findUnique({ where: { slug: id }, include: { category: true } }))
  if (!post) return apiError(404, "内容不存在")
  if (!session && !isPublicPost(post)) {
    return apiError(404, "内容不存在")
  }
  return NextResponse.json(post, {
    headers: session
      ? { "Cache-Control": "private, no-store", Vary: "Cookie" }
      : { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300", Vary: "Cookie" },
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireSessionOrBearer(req)
  if (!gate) return apiError(401, "未登录")
  if (gate.kind === "session" && passwordChangeRequired(gate.session)) {
    return apiError(403, "请先修改默认密码")
  }
  const { id } = await params
  const parsed = postUpdateSchema.safeParse(await req.json())
  if (!parsed.success) return apiZodError(parsed.error)
  const body = parsed.data as any
  const prev = await prisma.post.findUnique({ where: { id }, select: { status: true, publishedAt: true } })
  if (!prev) return apiError(404, "内容不存在")
  const prevPublic = isPublicPost({ status: prev.status, publishedAt: prev.publishedAt })

  const data: any = {}
  if (body.title !== undefined) data.title = body.title
  if (body.titleZh !== undefined) data.titleZh = body.titleZh
  if (body.slug !== undefined) data.slug = body.slug
  if (body.excerpt !== undefined) data.excerpt = body.excerpt
  if (body.excerptZh !== undefined) data.excerptZh = body.excerptZh
  if (body.summary !== undefined) data.summary = body.summary
  if (body.content !== undefined) data.content = body.content
  if (body.status !== undefined) {
    data.status = body.status
    if (body.status === "published") data.publishedAt = new Date()
  }
  // 定时发布（v0.3 P1-8）：显式传 publishedAt（未来时间）覆盖上面的 now——
  // 前台查询惰性过滤（publishedAt <= now），到期自然放出，无需 cron
  if (body.publishedAt !== undefined) {
    const d = new Date(body.publishedAt)
    if (!isNaN(d.getTime())) data.publishedAt = d
  }
  if (body.categoryId !== undefined) data.categoryId = body.categoryId
  if (body.tags !== undefined) data.tags = Array.isArray(body.tags) ? body.tags.map((t: string) => String(t).trim()).filter(Boolean) : []
  if (body.pageConfig !== undefined) data.pageConfig = body.pageConfig
  if (body.seoTitle !== undefined) data.seoTitle = body.seoTitle
  if (body.seoTitleZh !== undefined) data.seoTitleZh = body.seoTitleZh
  if (body.seoDescription !== undefined) data.seoDescription = body.seoDescription
  if (body.seoDescriptionZh !== undefined) data.seoDescriptionZh = body.seoDescriptionZh
  if (body.seoKeywords !== undefined) data.seoKeywords = body.seoKeywords
  if (body.ogImage !== undefined) data.ogImage = body.ogImage
  if (body.canonicalUrl !== undefined) data.canonicalUrl = body.canonicalUrl
  if (body.noIndex !== undefined) data.noIndex = !!body.noIndex
  if (body.featured !== undefined) data.featured = !!body.featured
  if (body.readTime !== undefined) data.readTime = body.readTime
  if (body.author !== undefined) data.author = body.author
  if (body.authorInitial !== undefined) data.authorInitial = body.authorInitial

  try {
    const post = await prisma.post.update({ where: { id }, data })
    revalidatePostPaths(post)
    // 仅「新进入公开可见」时推送，避免对已发布文章的日常编辑重复通知
    if (!prevPublic && isPublicPost(post)) {
      const { notifyPublishedPost } = await import("@/lib/fcm")
      void notifyPublishedPost(post)
    }
    return NextResponse.json(post)
  } catch (e: any) {
    if (e.code === "P2025") return apiError(404, "内容不存在")
    if (e.code === "P2002") return apiError(400, "Slug 已存在")
    console.error(e)
    return apiError(500, "更新失败")
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireSessionOrBearer(_req)
  if (!gate) return apiError(401, "未登录")
  if (gate.kind === "session" && passwordChangeRequired(gate.session)) {
    return apiError(403, "请先修改默认密码")
  }
  const { id } = await params
  try {
    const existing = await prisma.post.findUnique({ where: { id }, select: { slug: true } })
    await prisma.post.delete({ where: { id } })
    // 墓碑失败不得掩盖「文章已删」：捕获后仍返回 ok，App 下次全量同步可补
    try {
      await prisma.deletedPost.upsert({
        where: { postId: id },
        create: { postId: id },
        update: { deletedAt: new Date() },
      })
    } catch (te) {
      console.error("[posts/delete] tombstone upsert failed:", te)
    }
    revalidatePostPaths({ id, slug: existing?.slug })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e.code === "P2025") return apiError(404, "内容不存在")
    console.error(e)
    return apiError(500, "删除失败")
  }
}
