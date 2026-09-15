import { prisma } from "./prisma"
import { unstable_cache, revalidateTag, revalidatePath } from "next/cache"
import type { ContentCategory } from "./categories"
import { slugifyHeading, dedupeHeadingId } from "./headings"

// 前台列表常量（client 组件请从 lib/list-constants 引入，勿直接 import 本文件）
export { FRONT_PAGE_SIZE_MAX, HOME_GROUP_LIMIT } from "./list-constants"

export interface PostDTO {
  id: string
  title: string
  titleZh: string | null
  slug: string
  excerpt: string | null
  excerptZh: string | null
  summary: string | null
  content: unknown
  status: string
  categoryId: string | null
  categoryName: string | null
  categorySlug: string | null
  tags: string[]
  pageConfig: unknown
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string[]
  ogImage: string | null
  canonicalUrl: string | null
  noIndex: boolean
  featured: boolean
  readTime: string | null
  author: string | null
  authorInitial: string | null
  viewCount: number
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  category: ContentCategory
  displayDate: string
  headings: { id: string; text: string; level: number }[]
  headingsZh: { id: string; text: string; level: number }[]
}

function toDisplayDate(d: Date | string | null): string {
  if (!d) return ""
  const date = typeof d === "string" ? new Date(d) : d
  if (isNaN(date.getTime())) return ""
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" })
}

function extractCategory(dto: any): ContentCategory {
  const name = dto.category?.name || dto.categoryName || "Design"
  // map legacy enum names to current（2026-09 类目重构：Design/Build/Lab/Found/Log）
  if (["Design", "Build", "Lab", "Found", "Log"].includes(name)) return name as ContentCategory
  return "Design"
}

/**
 * 提取目录（P3-13：递归遍历）。
 * 旧实现只遍历顶层 `doc.content`，于是写在引用块 / 列表里的标题永远进不了目录，
 * 读者会遇到"正文明明有小标题、目录里却找不到"的错位。
 *
 * ⚠️ 遍历顺序（先序、按文档顺序、全局递增序号）必须与
 * `components/editor/PostRenderer.tsx` 中 headingIds 的构建方式保持一致，
 * 否则目录锚点会指向不存在的 id。
 */
function extractHeadings(content: unknown): { id: string; text: string; level: number }[] {
  if (!content || typeof content !== "object") return []
  const doc = content as any
  const roots: any[] = doc.content || doc.root?.children || []

  const flat: { text: string; level: number }[] = []
  const walk = (parent: any, depth = 0) => {
    if (depth > 20) return // 与渲染端一致：防御畸形深嵌套结构
    const kids = Array.isArray(parent?.content) ? parent.content : []
    for (const c of kids) {
      if (c?.type === "heading") {
        // level 白名单化，与 PostRenderer 的 h${level} 保持一致
        const rawLevel = c.attrs?.level
        const level = [1, 2, 3, 4].includes(rawLevel) ? rawLevel : 2
        const text = (c.content || []).map((x: any) => x.text || "").join("").trim()
        if (text) flat.push({ text, level })
      }
      walk(c, depth + 1)
    }
  }
  walk({ content: roots })

  const seen = new Map<string, number>()
  return flat.map((h, i) => ({
    id: dedupeHeadingId(slugifyHeading(h.text, i), seen),
    text: h.text,
    level: h.level,
  }))
}

/** 唯一的公开可见性规则：草稿、归档和未来定时文章均不可从任何公开入口读取。 */
export function isPublicPost(row: { status?: string; publishedAt?: Date | string | null } | null | undefined, now = new Date()) {
  if (!row || row.status !== "published") return false
  return !row.publishedAt || new Date(row.publishedAt) <= now
}

export function publicPostWhere(now = new Date()) {
  return { status: "published", OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] }
}

/**
 * 数据层降级策略（统一收口）。
 *
 * ⚠️ 背景：此前只有 `getAllPosts()` 带 `catch → []`，详情查询没有任何保护。
 * 于是出现这样一条必崩路径——`.next/cache` 里已缓存了文章列表，而本次构建
 * 数据库不可达时：
 *   ① `generateStaticParams()` 从**缓存**拿到文章 id 列表并返回；
 *   ② 预渲染 `/posts/<id>` 调用 `getPostBySlug()`；
 *   ③ `prisma.post.findUnique` 抛 P1001 → 预渲染失败 → **整个 next build 退出码 1**。
 * 也就是说：构建能否成功，取决于缓存是否恰好为空。DB 一次抖动就能阻断部署。
 *
 * 现在统一为：
 *  - **构建期**（NEXT_PHASE=phase-production-build）：DB 不可达一律降级为空数据，
 *    保证 `next build` 不因数据库抖动而失败；
 *  - **运行期**：不吞异常，交由 error boundary 呈现——避免把线上故障静默伪装成空列表。
 *
 * ✅ 2026-09-15 已与作者确认：**保持此策略，不要改回"运行期静默返回空列表"**。
 *    旧行为会让数据库故障表现为"站点没有内容"，运维侧完全无从察觉。
 */
const IS_BUILD_PHASE = process.env.NEXT_PHASE === "phase-production-build"

async function degrade<T>(fn: () => Promise<T>, fallback: T, ctx: string): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    if (!IS_BUILD_PHASE) throw e
    console.warn(
      `[posts] ${ctx} 构建期降级（数据库不可达）:`,
      e instanceof Error ? e.message : e
    )
    return fallback
  }
}

function scheduledGuard(row: any) {
  if (!isPublicPost(row)) return null
  return mapPost(row)
}
function mapPost(row: any): PostDTO {
  const headings = extractHeadings(row.content)
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
    seoDescription: row.seoDescription,
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
    category: extractCategory(row),
    displayDate: toDisplayDate(row.publishedAt || row.createdAt),
    headings,
    // P3-14：目前中英共用同一份 Tiptap 正文（content），故 headingsZh 与 headings
    // 内容相同。消费方（PostClient / MPost）按「中文优先取 headingsZh」的规则取值，
    // 因此该字段必须保留。将来若正文做双语分离，需在此按 contentZh 单独提取，
    // 而不是继续复用 headings——否则中文目录会悄悄变成英文标题。
    headingsZh: headings,
  }
}

/**
 * 前台一次性拉取的硬上限。
 *
 * 首页 `/`、移动 `/m`、平板 `/t`、归档、以及 `/api/search-index` 共用本查询，
 * 因此**超出此上限的文章不会出现在这些入口**（不会报错，是静默的）。
 * 目前 17 篇，离上限还远；一旦触顶会打 warn 便于及时发现，而不是无声少内容。
 * 真要突破时应当给首页/归档引入分页，而不是简单调大这个数字。
 */
const FRONT_LIST_LIMIT = 100
let warnedFrontLimit = false

const getCachedPostRows = unstable_cache(
  async (status: string) => {
    const where: any = { status }
    if (status === "published") {
      Object.assign(where, publicPostWhere())
    }
    // 多取 1 条仅用于探测是否触顶
    const rows = await prisma.post.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: FRONT_LIST_LIMIT + 1,
    })
    if (rows.length > FRONT_LIST_LIMIT) {
      rows.length = FRONT_LIST_LIMIT
      if (!warnedFrontLimit) {
        warnedFrontLimit = true
        console.warn(
          `[posts] 前台列表已达 ${FRONT_LIST_LIMIT} 篇上限，超出部分不会展示在任何前台入口（含搜索索引）。` +
            `请为首页/归档引入分页后调高 FRONT_LIST_LIMIT。`
        )
      }
    }
    return rows
  },
  ["posts-by-status"],
  { revalidate: 60, tags: ["posts"] }
)

/** 列表场景轻量化：剔除正文/渲染重字段（RSC 载荷瘦身；列表客户端不读取这些字段，阅读页请用原始 post） */
export function stripPostHeavy<T extends Record<string, any>>(p: T) {
  // 解构即"剔除"：这些重字段被刻意丢弃、永不进入列表载荷，故对 no-unused-vars 抑制
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { content, contentZh, markdown, markdownZh, html, htmlZh, headings, headingsZh, pageConfig, ...rest } = p as any;
  return rest as T;
}

export async function getAllPosts(opts?: { status?: string; locale?: string }) {
  const where: any = {}
  if (opts?.status) where.status = opts.status
  else where.status = "published"
  return degrade(
    async () => {
      const rows = await getCachedPostRows(where.status)
      return rows.map(mapPost)
    },
    [] as PostDTO[],
    "getAllPosts"
  )
}

export interface PostPage {
  items: PostDTO[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 前台分页查询（服务端真分页，归档 / 标签页 / 移动归档共用）。
 *
 * 为什么不放客户端分页：此前前台一律 `getAllPosts()` 全量下发，受
 * FRONT_LIST_LIMIT 硬顶（超出即静默丢文）且 RSC 载荷随文章数线性膨胀。
 * 服务端分页后上限由 pageSize 决定，不再有"第 101 篇消失"的问题。
 *
 * - 只返回已发布且已到发布时间的文章（复用 publicPostWhere，唯一可见性规则）
 * - 搜索在服务端完成（标题/摘要中英 + 分类名），保证"搜索结果分页"语义正确
 * - 支持按分类名 / 标签过滤（首页分组「查看全部」走归档 + category 参数）
 * - 页码越界自动回退到最后一页，避免空页
 */
const getCachedPostPage = unstable_cache(
  async (page: number, pageSize: number, q: string, tag: string, category: string) => {
    const where: any = { ...publicPostWhere() }
    const and: any[] = []
    if (tag) {
      // 数组精确匹配 + 常见大小写变体：保持原先 toLowerCase 比较的容错行为
      and.push({ tags: { hasSome: [...new Set([tag, tag.toLowerCase(), tag.toUpperCase()])] } })
    }
    if (category) and.push({ category: { name: category } })
    if (q) {
      const qs = q.trim()
      and.push({
        OR: [
          { title: { contains: qs, mode: "insensitive" } },
          { titleZh: { contains: qs, mode: "insensitive" } },
          { excerpt: { contains: qs, mode: "insensitive" } },
          { excerptZh: { contains: qs, mode: "insensitive" } },
          { category: { name: { contains: qs, mode: "insensitive" } } },
        ],
      })
    }
    if (and.length) where.AND = and
    const [rows, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: { category: true },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.post.count({ where }),
    ])
    return { rows: rows.map(mapPost), total }
  },
  ["posts-page"],
  { revalidate: 60, tags: ["posts"] }
)

export async function getPostsPage(opts: {
  page?: number
  pageSize?: number
  q?: string
  tag?: string
  category?: string
} = {}): Promise<PostPage> {
  const pageSize = Math.min(Math.max(Number(opts.pageSize) || 10, 1), 100)
  const requested = Math.max(Number(opts.page) || 1, 1)
  const q = opts.q || ""
  const tag = opts.tag || ""
  const category = opts.category || ""
  return degrade(
    async () => {
      let { rows, total } = await getCachedPostPage(requested, pageSize, q, tag, category)
      const totalPages = Math.max(1, Math.ceil(total / pageSize))
      let page = requested
      if (requested > totalPages) {
        page = totalPages
        ;({ rows, total } = await getCachedPostPage(page, pageSize, q, tag, category))
      }
      return { items: rows, total, page, pageSize, totalPages }
    },
    { items: [], total: 0, page: requested, pageSize, totalPages: 1 },
    "getPostsPage"
  )
}

/** 归档刊头统计（全站口径，不随分页变化）：年数 / 分类数 / 最近更新 */
export async function getArchiveStats() {
  return degrade(
    async () => {
      const rows = await prisma.post.findMany({
        where: publicPostWhere(),
        select: { publishedAt: true, createdAt: true, category: { select: { name: true } } },
      })
      const years = new Set<number>()
      const cats = new Set<string>()
      let latest = 0
      for (const r of rows) {
        const d = r.publishedAt || r.createdAt
        if (d) {
          const t = new Date(d)
          if (!Number.isNaN(t.getTime())) {
            years.add(t.getFullYear())
            latest = Math.max(latest, t.getTime())
          }
        }
        if (r.category?.name) cats.add(r.category.name)
      }
      return {
        yearCount: years.size,
        categoryCount: cats.size,
        latestAt: latest ? new Date(latest).toISOString() : null,
      }
    },
    { yearCount: 0, categoryCount: 0, latestAt: null as string | null },
    "getArchiveStats"
  )
}

/**
 * 标签共现（相关标签）：基于该标签的**全部**文章计算，不随分页变化。
 * 只 select tags 字段，不受分页影响、也不把正文带进内存。
 */
export async function getRelatedTags(tag: string, limit = 10): Promise<string[]> {
  return degrade(
    async () => {
      const rows = await prisma.post.findMany({
        where: { ...publicPostWhere(), tags: { hasSome: [...new Set([tag, tag.toLowerCase(), tag.toUpperCase()])] } },
        select: { tags: true },
      });
      const freq = new Map<string, number>();
      for (const r of rows) {
        for (const tg of r.tags || []) {
          const key = String(tg).trim();
          if (!key || key.toLowerCase() === tag.toLowerCase()) continue;
          freq.set(key, (freq.get(key) || 0) + 1);
        }
      }
      return [...freq.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, limit)
        .map(([k]) => k);
    },
    [] as string[],
    "getRelatedTags"
  );
}

export async function getPostBySlug(slug: string) {
  return degrade(
    async () => {
      const row = await prisma.post.findUnique({ where: { slug }, include: { category: true } })
      return scheduledGuard(row)
    },
    null,
    `getPostBySlug(${slug})`
  )
}

export async function getPostById(id: string) {
  return degrade(
    async () => {
      const row = await prisma.post.findUnique({ where: { id }, include: { category: true } })
      return scheduledGuard(row)
    },
    null,
    `getPostById(${id})`
  )
}

export async function getFeaturedPost() {
  return degrade(
    async () => {
      const row = await prisma.post.findFirst({ where: { ...publicPostWhere(), featured: true }, include: { category: true } })
      if (!row) return null
      return mapPost(row)
    },
    null,
    "getFeaturedPost"
  )
}

export async function getAllPostSlugs() {
  return degrade(
    async () => {
      const rows = await prisma.post.findMany({ where: publicPostWhere(), select: { slug: true } })
      return rows.map((r) => r.slug)
    },
    [] as string[],
    "getAllPostSlugs"
  )
}

/**
 * 文章变更后的缓存失效（P3-16）。
 *
 * 此前 `/api/posts` 与 `/api/posts/[id]` 各自内联了一份**内容重复**的实现，
 * 是典型的漂移源——本次修复就发现旧版本只覆盖了桌面路径，移动端 `/m/posts/*`
 * 与平板 `/t/posts/*` 的缓存不会随之失效（读者会看到旧的移动端页面）。
 */
export function revalidatePostPaths(post?: { id: string; slug?: string | null }) {
  revalidateTag("posts")
  revalidatePath("/")
  revalidatePath("/rss.xml")
  revalidatePath("/sitemap.xml")
  for (const base of ["/posts", "/m/posts", "/t/posts"]) {
    revalidatePath(`${base}/[id]`, "page")
    if (post) {
      revalidatePath(`${base}/${post.id}`)
      if (post.slug) revalidatePath(`${base}/${post.slug}`)
    }
  }
}

export async function incrementViewCount(id: string) {
  await prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } })
}

export function groupByYear(posts: PostDTO[]): Map<number, PostDTO[]> {
  const map = new Map<number, PostDTO[]>()
  for (const p of posts) {
    const d = p.publishedAt || p.createdAt
    const y = d ? new Date(d).getFullYear() : 0
    if (!map.has(y)) map.set(y, [])
    map.get(y)!.push(p)
  }
  return new Map([...map.entries()].sort((a, b) => b[0] - a[0]))
}
