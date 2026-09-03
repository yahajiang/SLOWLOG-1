import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || ""
  const status = searchParams.get("status") || ""
  const session = await auth()

  const where: any = {}
  // 未认证：仅返回已发布文章
  // 已认证 + status=all：返回全部
  // 已认证 + 指定 status：返回该状态
  if (!session) {
    where.status = "published"
  } else if (status && status !== "all") {
    where.status = status
  }
  if (q) where.OR = [{ title: { contains: q, mode: "insensitive" } }, { titleZh: { contains: q, mode: "insensitive" } }]
  // 列表 API 排除 content 大字段，详情走 /api/posts/[id]
  const posts = await prisma.post.findMany({
    where,
    select: {
      id: true, title: true, titleZh: true, slug: true, excerpt: true,
      excerptZh: true, status: true, featured: true, tags: true, readTime: true,
      author: true, authorInitial: true, viewCount: true, publishedAt: true,
      createdAt: true, updatedAt: true, categoryId: true,
      category: { select: { name: true, nameZh: true, slug: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  })
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const tags: string[] = Array.isArray(body.tags) ? body.tags.map((t: string) => String(t).trim()).filter(Boolean) : []
  if (tags.length === 0) return NextResponse.json({ error: "至少选择一个标签" }, { status: 400 })
  if (!body.categoryId) return NextResponse.json({ error: "请选择分类" }, { status: 400 })
  const slug = body.slug?.trim() || body.title?.toLowerCase().replace(/[^\w]+/g, "-") || `post-${Date.now()}`
  try {
    const post = await prisma.post.create({
      data: {
        title: body.title || "未命名",
        titleZh: body.titleZh || body.title || "未命名",
        slug,
        excerpt: body.excerpt || "",
        excerptZh: body.excerptZh || body.excerpt || "",
        content: body.content || { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] },
        status: body.status || "draft",
        categoryId: body.categoryId || null,
        tags: tags,
        pageConfig: body.pageConfig || undefined,
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
        seoKeywords: body.seoKeywords || [],
        readTime: body.readTime,
        author: body.author,
        authorInitial: body.authorInitial,
        featured: !!body.featured,
        publishedAt: body.status === "published" ? new Date() : null,
      },
    })
    revalidatePath("/")
    revalidatePath("/sitemap.xml")
    revalidatePath("/rss.xml")
    return NextResponse.json(post)
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Slug 已存在" }, { status: 400 })
    console.error(e)
    return NextResponse.json({ error: "创建失败" }, { status: 500 })
  }
}
