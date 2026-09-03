import type { Dict } from "./i18n";

/** 与桌面端 page.tsx / posts/[id]/page.tsx 同构的 legacy Post 适配（移动端独立复刻，桌面文件零改动） */
export function adaptPost(p: any) {
  return {
    id: p.id,
    title: p.title,
    titleZh: p.titleZh || p.title,
    excerpt: p.excerpt || "",
    excerptZh: p.excerptZh || p.excerpt || "",
    category: p.category as any,
    author: p.author || "Yahajiang",
    authorInitial: p.authorInitial || "Y",
    date: p.publishedAt
      ? new Date(p.publishedAt).toISOString().slice(0, 10)
      : new Date(p.createdAt).toISOString().slice(0, 10),
    displayDate: p.displayDate,
    readTime: p.readTime || "5 min",
    featured: p.featured,
    draft: p.status === "draft",
    tags: p.tags,
    markdown: "",
    markdownZh: "",
    html: "",
    htmlZh: "",
    headings: p.headings,
    headingsZh: p.headingsZh,
    createdAt:
      typeof p.createdAt === "string" ? p.createdAt : new Date(p.createdAt).toISOString(),
    content: p.content,
    pageConfig: p.pageConfig,
  } as any;
}

/** 分类名本地化（与桌面 catLabel 同规则，移动端独立复刻） */
export function mCatLabel(cat: string, t: Dict): string {
  if (cat === "All") return t.catAll;
  if (cat === "Design") return t.catDesign;
  if (cat === "Plugin") return t.catPlugin;
  if (cat === "Engineering") return t.catEngineering;
  if (cat === "Typography") return t.catTypography;
  if (cat === "Frontend") return t.catFrontend;
  if (cat === "Snippet") return t.catSnippet;
  return cat;
}
