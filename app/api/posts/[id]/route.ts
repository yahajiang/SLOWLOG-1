import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// 文章数据变更后立即再生前台缓存：数据缓存 tag + 首页 + 文章详情路由（覆盖 id/slug 两种地址形态）
function revalidatePostViews(post?: { id: string; slug?: string | null }) {
  revalidateTag("posts")
  revalidatePath("/")
  revalidatePath("/rss.xml")
  revalidatePath("/sitemap.xml")
  revalidatePath("/posts/[id]", "page")
  if (post) {
    revalidatePath(`/posts/${post.id}`)
    if (post.slug) revalidatePath(`/posts/${post.slug}`)
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id }, include: { category: true } })
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
  // 非 published 文章需要鉴权
  if (post.status !== "published") {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(post)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()

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
    revalidatePostViews(post)
    return NextResponse.json(post)
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
    const existing = await prisma.post.findUnique({ where: { id }, select: { slug: true } })
    await prisma.post.delete({ where: { id } })
    revalidatePostViews({ id, slug: existing?.slug })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 })
    console.error(e)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
