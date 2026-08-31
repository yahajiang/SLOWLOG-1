import { prisma } from "./prisma"

export async function getCategoriesWithCount() {
  const cats = await prisma.category.findMany({ include: { _count: { select: { posts: true } } }, orderBy: { createdAt: "asc" } })
  return cats
}

export async function ensureDefaultCategories() {
  const defaults = [
    { name: "Design", nameZh: "设计", slug: "design" },
    { name: "Plugin", nameZh: "插件", slug: "plugin" },
    { name: "Engineering", nameZh: "工程", slug: "engineering" },
    { name: "Typography", nameZh: "字体", slug: "typography" },
    { name: "Frontend", nameZh: "前端", slug: "frontend" },
    { name: "Snippet", nameZh: "点滴", slug: "snippet" },
  ]
  for (const c of defaults) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c })
  }
}
