import { prisma } from "./prisma"
import type { ContentCategory } from "./categories"

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
  // derived for legacy frontend compat
  category: ContentCategory
  displayDate: string
  headings: { id: string; text: string; level: number }[]
  headingsZh: { id: string; text: string; level: number }[]
}

function toDisplayDate(d: Date | null): string {
  if (!d) return ""
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" })
}

function extractCategory(dto: any): ContentCategory {
  const name = dto.category?.name || dto.categoryName || "Design"
  // map legacy enum names to current
  if (["Design","Plugin","Engineering","Typography","Frontend","Snippet"].includes(name)) return name as ContentCategory
  return "Design"
}

function extractHeadings(content: unknown): { id: string; text: string; level: number }[] {
  if (!content || typeof content !== "object") return []
  const doc = content as any
  const nodes: any[] = doc.content || doc.root?.children || []
  const headings: { id: string; text: string; level: number }[] = []
  for (const n of nodes) {
    if (n.type === "heading") {
      const level = n.attrs?.level || 2
      const text = (n.content || []).map((c: any) => c.text || "").join("")
      if (text) {
        const id = text.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "")
        headings.push({ id, text, level })
      }
    }
  }
  return headings
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
    headingsZh: headings,
  }
}

export async function getAllPosts(opts?: { status?: string; locale?: string }) {
  const where: any = {}
  if (opts?.status) where.status = opts.status
  else where.status = "published"
  const rows = await prisma.post.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  return rows.map(mapPost)
}

export async function getPostBySlug(slug: string) {
  const row = await prisma.post.findUnique({ where: { slug }, include: { category: true } })
  if (!row) return null
  return mapPost(row)
}

export async function getPostById(id: string) {
  const row = await prisma.post.findUnique({ where: { id }, include: { category: true } })
  if (!row) return null
  return mapPost(row)
}

export async function getFeaturedPost() {
  const row = await prisma.post.findFirst({ where: { featured: true, status: "published" }, include: { category: true } })
  if (!row) return null
  return mapPost(row)
}

export async function getAllPostSlugs() {
  const rows = await prisma.post.findMany({ where: { status: "published" }, select: { slug: true } })
  return rows.map((r) => r.slug)
}

export async function incrementViewCount(id: string) {
  await prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } })
}
