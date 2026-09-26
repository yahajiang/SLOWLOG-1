import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiError } from "@/lib/api-utils"
import { canReadUnpublished, lookupBearer, syncAuthError } from "@/lib/app-auth"
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

  // 凭据判定：**「没带」与「带了但不认」必须分开**
  //   无 Authorization 头 → 游客模式：仅公开内容且不含 content（未配置凭据的读者走这条，正常）；
  //   带了却无效/过期/已撤销 → 401，**不降级**。
  // 若在此降级成游客，客户端只会拿到「无 content 的公开列表」并照常落库
  // （Room @Upsert 是整行替换），把本地已同步的正文覆盖成 NULL ——
  // 症状是「设置里显示已配置、列表正常、正文全空」，且没有任何报错。
  const headerPresent = !!req.headers.get("authorization")
  const lookup = await lookupBearer(req)
  if (headerPresent && !lookup.ok) return syncAuthError(lookup.reason)
  const bearer = lookup.ok
  // 未发布内容（草稿 / 定时 / 已下架）只对**管理员身份**开放（2026-09-25）。
  // `reader` 是 App 自助注册的只读账号：它与匿名访客的差别只是「能离线读正文」，
  // 不该看见还没公开的东西。`role === null` 是本次改动之前签发的历史令牌 ⇒ 按作者处理。
  const fullAccess = lookup.ok && canReadUnpublished(lookup.role)
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
    // 过滤条件按**权限**而不是「带没带凭据」：reader 带了有效凭据，但仍只该拿到公开内容。
    const postWhere: any = fullAccess
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
    // ⚠️ 随想必须和文章共用同一条「游标 + 有界一页 + 报告是否截断」的规则。
    // 此前是 `take: since ? 200 : 50`，而排序是 updatedAt **升序**：首次全量同步
    // 取到的是「最旧的 50 条」，客户端随后把 since 推到 serverTime，于是第 51 条起
    // （含刚发布的新随想）永远落不进任何一页 —— 症状正是「后台发布成功、
    // 读者端再也不出现」，而且全程不报错。
    const noteRows = await prisma.note.findMany({
      where: noteWhere,
      orderBy: { updatedAt: "asc" },
      take: pageSize + 1,
    })
    const notesTruncated = noteRows.length > pageSize
    const notes = notesTruncated ? noteRows.slice(0, pageSize) : noteRows
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
        // 客户端据此判断「这一页不是全部」：继续按游标翻页，翻到底才把 since
        // 推到 serverTime。缺了这个旗标，任何超过一页的站点都会被静默截断。
        hasMore: truncated || notesTruncated,
      },
      { headers: { "Cache-Control": "private, no-store", Vary: "Cookie, Authorization" } }
    )
  } catch (e) {
    console.error("[app/sync]", e)
    return apiError(500, "同步失败")
  }
}
