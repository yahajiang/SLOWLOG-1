import { prisma } from "./prisma"

export async function getCategoriesWithCount() {
  const cats = await prisma.category.findMany({ include: { _count: { select: { posts: true } } }, orderBy: { createdAt: "asc" } })
  return cats
}

export async function ensureDefaultCategories() {
  const defaults = [
    { name: "Design", nameZh: "设计", slug: "design", description: "Posters, typography, visual communication, UI", descriptionZh: "海报、排版、字体、视觉传达、UI" },
    { name: "Build", nameZh: "开发", slug: "build", description: "Frontend, Python, plugins, websites", descriptionZh: "前端、Python、插件、网站制作" },
    { name: "Lab", nameZh: "实验", slug: "lab", description: "AI, interaction, visual experiments and new things", descriptionZh: "AI、交互、视觉实验、各种新东西" },
    { name: "Found", nameZh: "发现", slug: "found", description: "Good sites, assets, tools, inspiration, cases", descriptionZh: "好网站、素材、工具、灵感、案例" },
    { name: "Log", nameZh: "记录", slug: "log", description: "Learning, travel, life, notes", descriptionZh: "学习、旅行、生活、随笔" },
  ]
  for (const c of defaults) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c })
  }
}
