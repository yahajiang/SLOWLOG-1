import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiError } from "@/lib/api-utils"
import { bearerToken } from "@/lib/app-auth"
import { publicPostWhere, stripPostHeavy } from "@/lib/posts"
import { getSettings } from "@/lib/settings"

export const dynamic = "force-dynamic"

const WINDOW_MS = 90 * 24 * 60 * 60 * 1000
const FRONT_LIST_LIMIT = 100
const PAGE_MAX = 200

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const sinceRaw = url.searchParams.get("since") || ""
  const pageSizeRaw = parseInt(url.searchParams.get("pageSize") || "", 10)
  const pageSize = Number.isFinite(pageSizeRaw)
    ? Math.min(Math.max(pageSizeRaw, 1), PAGE_MAX)
    : 100

  const bearer = await bearerToken(req)
  const now = new Date()

  // 契约（S2.5）：since 缺失或非法 → 全量模式，**不 400**；
  // 仅「合法日期且早于 now-90d」才 400 提示全量重拉。
  let since: Date | null = null
  if (sinceRaw) {
    const d = new Date(sinceRaw)
    if (!isNaN(d.getTime())) {
      if (now.getTime() - d.getTime() > WINDOW_MS) {
        return apiError(400, "同步窗口过期，请全量重拉")
      }
      since = d
    } else {
      console.warn("[app/sync] invalid since, falling back to full mode:", sinceRaw)
    }
  }

  try {
    const postWhere: any = bearer
      ? since
        ? { updatedAt: { gt: since } }
        : {}
      : since
        ? { AND: [publicPostWhere(), { updatedAt: { gt: since } }] }
        : publicPostWhere()

    const take = since ? pageSize : Math.min(pageSize, FRONT_LIST_LIMIT + 1)
    const postRows = await prisma.post.findMany({
      where: postWhere,
      include: { category: true },
      orderBy: { updatedAt: "asc" },
      take: take + 1,
    })
    const truncated = postRows.length > take
    const rows = truncated ? postRows.slice(0, take) : postRows
    if (truncated && !since) {
      console.warn("[app/sync] full sync hit FRONT_LIST_LIMIT-style cap:", take)
    }

    const postsChanged = rows.map((row) => {
      if (bearer) {
        return {
          id: row.id,
          title: row.title,
          titleZh: row.titleZh ?? row.title,
          slug: row.slug,
          excerpt: row.excerpt,
          excerptZh: row.excerptZh ?? row.excerpt,
          summary: row.summary,
          content: row.content,
          status: row.status,
          categoryId: row.categoryId,
          categoryName: row.category?.name ?? null,
          categorySlug: row.category?.slug ?? null,
          tags: row.tags ?? [],
          pageConfig: row.pageConfig,
          seoTitle: row.seoTitle,
          seoTitleZh: (row as any).seoTitleZh ?? null,
          seoDescription: row.seoDescription,
          seoDescriptionZh: (row as any).seoDescriptionZh ?? null,
          seoKeywords: row.seoKeywords ?? [],
          ogImage: row.ogImage,
          canonicalUrl: row.canonicalUrl,
          noIndex: row.noIndex ?? false,
          featured: row.featured ?? false,
          readTime: row.readTime,
          author: row.author,
          authorInitial: row.authorInitial,
          viewCount: row.viewCount ?? 0,
          publishedAt: row.publishedAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          category: row.category?.name || "Design",
        }
      }
      return stripPostHeavy({
        id: row.id,
        title: row.title,
        titleZh: row.titleZh ?? row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        excerptZh: row.excerptZh ?? row.excerpt,
        status: row.status,
        featured: row.featured ?? false,
        tags: row.tags ?? [],
        readTime: row.readTime,
        author: row.author,
        authorInitial: row.authorInitial,
        viewCount: row.viewCount ?? 0,
        publishedAt: row.publishedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        categoryId: row.categoryId,
        categoryName: row.category?.name ?? null,
        category: row.category?.name || "Design",
      })
    })

    const tombstones = await prisma.deletedPost.findMany({
      where: since ? { deletedAt: { gt: since } } : {},
      select: { postId: true },
      orderBy: { deletedAt: "asc" },
    })

    const categories = await prisma.category.findMany({
      include: { _count: { select: { posts: { where: publicPostWhere() } } } },
      orderBy: { createdAt: "asc" },
    })

    const noteWhere = since ? { updatedAt: { gt: since } } : {}
    const notes = await prisma.note.findMany({
      where: noteWhere,
      orderBy: { updatedAt: "asc" },
      take: since ? 200 : 50,
    })
    const thoughtsChanged = notes.map((doc) => ({
      id: doc.id,
      text: doc.content || "",
      textZh: doc.contentZh || doc.content || "",
      content: doc.content || "",
      contentZh: doc.contentZh || doc.content || "",
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }))

    const settings = await getSettings()

    return NextResponse.json(
      {
        postsChanged,
        deletedIds: tombstones.map((t) => t.postId),
        categories,
        thoughtsChanged,
        settings,
        serverTime: now.toISOString(),
      },
      { headers: { "Cache-Control": "private, no-store", Vary: "Cookie, Authorization" } }
    )
  } catch (e) {
    console.error("[app/sync]", e)
    return apiError(500, "同步失败")
  }
}
