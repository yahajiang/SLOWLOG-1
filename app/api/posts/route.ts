import { NextRequest, NextResponse } from "next/server"
import { postCreateSchema } from "@/lib/schemas"
import { apiError, apiZodError } from "@/lib/api-utils"
import { auth, passwordChangeRequired } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { publicPostWhere, revalidatePostPaths } from "@/lib/posts"
import { slugFromTitle } from "@/lib/slug"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || ""
  const status = searchParams.get("status") || ""
  // 分页：page 从 1 起；不传 page = 全量（兼容旧调用方）
  const pageParam = parseInt(searchParams.get("page") || "", 10)
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : null
  const session = await auth()

  const filters: any[] = []
  // 未认证：仅返回已发布且已到发布时间的文章。
  // 已认证 + status=all：返回全部；后台响应不会进入共享缓存。
  if (!session) {
    filters.push(publicPostWhere())
  } else if (status && status !== "all") {
    filters.push({ status })
  }
  if (q) {
    // P3-12：转义 LIKE 元字符。Prisma 的 contains 会把值直接拼进 LIKE 模式，
    // 于是用户搜 "%" 会匹配全部记录、搜 "_" 可逐位爆破，既返回错误结果，
    // 也让一次搜索退化成全表扫描。PostgreSQL 的 LIKE 默认以反斜杠为转义符，
    // 因此只需转义 \ % _ 三者；tags 走数组 has 语义，不参与 LIKE，用原值。
    const qSafe = q.replace(/[\\%_]/g, (m) => "\\" + m)
    filters.push({ OR: [
      { title: { contains: qSafe, mode: "insensitive" } },
      { titleZh: { contains: qSafe, mode: "insensitive" } },
      { excerpt: { contains: qSafe, mode: "insensitive" } },
      { excerptZh: { contains: qSafe, mode: "insensitive" } },
      { tags: { has: q } },
    ] })
  }
  const where = filters.length ? { AND: filters } : {}
  // 登录态拉全量（列表无 content 大字段），游客保持 100 上限
  const take = session ? 500 : 100
  const posts = await prisma.post.findMany({
    where,
    skip: page ? (page - 1) * take : undefined,
    take: page ? take : undefined,
    select: {
      id: true, title: true, titleZh: true, slug: true, excerpt: true,
      excerptZh: true, status: true, featured: true, tags: true, readTime: true,
      author: true, authorInitial: true, viewCount: true, publishedAt: true,
      createdAt: true, updatedAt: true, categoryId: true,
      category: { select: { name: true, nameZh: true, slug: true } },
    },
    orderBy: { updatedAt: "desc" },
  })
  const total = page ? await prisma.post.count({ where }) : null
  return NextResponse.json(posts, {
    headers: {
      ...(session
        ? { "Cache-Control": "private, no-store", Vary: "Cookie" }
        : { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300", Vary: "Cookie" }),
      ...(total !== null ? { "X-Total-Count": String(total) } : {}),
    },
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError(401, "未登录")
  if (passwordChangeRequired(session)) return NextResponse.json({ error: "请先修改默认密码" }, { status: 403 })
  const parsed = postCreateSchema.safeParse(await req.json())
  if (!parsed.success) return apiZodError(parsed.error)
  const body = parsed.data
  const tags: string[] = Array.isArray(body.tags) ? body.tags.map((t: string) => String(t).trim()).filter(Boolean) : []
  if (tags.length === 0) return apiError(400, "至少选择一个标签")
  if (!body.categoryId) return apiError(400, "请选择分类")
  // slug 兜底：中文标题走拼音，保证非空且唯一（P0-1：旧实现对中文恒返回 "-"）
  const slug = body.slug?.trim() || (await slugFromTitle(body.title || "未命名"))
  // 定时发布创建路径：显式 publishedAt（未来时间）优先于默认 now（与 PUT 对齐）
  const scheduledAt = body.publishedAt !== undefined ? new Date(body.publishedAt) : null
  const scheduled = scheduledAt && !isNaN(scheduledAt.getTime()) ? scheduledAt : null
  try {
    const post = await prisma.post.create({
      data: {
        title: body.title || "未命名",
        titleZh: body.titleZh || body.title || "未命名",
        slug,
        excerpt: body.excerpt || "",
        excerptZh: body.excerptZh || body.excerpt || "",
        content: (body.content as any) || { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] },
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
        publishedAt: body.status === "published" ? (scheduled ?? new Date()) : scheduled,
      },
    })
    revalidatePostPaths(post)
    return NextResponse.json(post)
  } catch (e: any) {
    if (e.code === "P2002") return apiError(400, "Slug 已存在")
    console.error(e)
    return apiError(500, "创建失败")
  }
}
