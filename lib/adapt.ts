/**
 * 三端共享的数据适配层（第 4 阶段架构减债）：
 * 桌面 / 平板 /t / 移动 /m 的页面不再各自内联 post 适配、相关文章打分与 SEO 组装——
 * 统一经由本模块，保证字段兜底、日期归一与打分规则全站唯一。
 */
import type { Post } from "./types";
import type { PageConfig } from "./page-config";
import { parsePageConfig } from "./page-config";
import type { Dict } from "./i18n";

/** 列表/阅读通用的 legacy Post 形状（三端客户端组件的统一输入） */
export type LegacyPost = Post & {
  slug?: string;
  status?: string;
  publishedAt?: string | Date | null;
  content?: unknown;
  pageConfig?: PageConfig;
  summary?: string;
  viewCount?: number;
};

/** 分类 DTO（列表/筛选统一形状） */
export interface CategoryDTO {
  id: string;
  name: string;
  nameZh?: string | null;
  slug: string;
  description?: string | null;
  descriptionZh?: string | null;
  coverImageUrl?: string | null;
  count?: number;
}

/**
 * Prisma/缓存行 → legacy Post：三端唯一适配入口。
 * 输入允许携带重字段（content/markdown/html…）；列表侧请先经 stripPostHeavy
 * 剥离，再进本适配——适配器只做字段映射，不负责减重。
 */
export function adaptLegacyPost(p: any): LegacyPost {
  return {
    id: p.id,
    title: p.title,
    titleZh: p.titleZh || p.title,
    excerpt: p.excerpt || "",
    excerptZh: p.excerptZh || p.excerpt || "",
    category: p.category,
    author: p.author || "Yahajiang",
    authorInitial: p.authorInitial || "Y",
    date: p.publishedAt
      ? new Date(p.publishedAt).toISOString().slice(0, 10)
      : new Date(p.createdAt).toISOString().slice(0, 10),
    displayDate: p.displayDate,
    readTime: p.readTime || "5 min",
    featured: p.featured,
    draft: p.status === "draft",
    tags: p.tags ?? [],
    markdown: "",
    markdownZh: "",
    html: "",
    htmlZh: "",
    headings: p.headings,
    headingsZh: p.headingsZh,
    createdAt: typeof p.createdAt === "string" ? p.createdAt : new Date(p.createdAt).toISOString(),
    content: p.content,
    pageConfig: p.pageConfig ? parsePageConfig(p.pageConfig) : undefined,
    slug: p.slug,
    status: p.status,
    publishedAt:
      typeof p.publishedAt === "string"
        ? p.publishedAt
        : p.publishedAt
          ? new Date(p.publishedAt).toISOString()
          : null,
    viewCount: p.viewCount,
    summary: p.summary,
  };
}

/** 相关文章打分：同分类 ×10 + 同标签 ×3，平局取最新（全站唯一规则） */
export function pickRelated(
  all: LegacyPost[],
  current: { id: string; category?: string; tags?: string[] },
  max = 3
): LegacyPost[] {
  const exclude = new Set([current.id]);
  const curTags = new Set((current.tags || []).map((t: string) => String(t).toLowerCase()));
  return all
    .filter((p) => !exclude.has(p.id))
    .map((p) => {
      const tags = (p.tags || []).map((t: string) => String(t).toLowerCase());
      const overlap = tags.filter((t) => curTags.has(t)).length;
      const sameCat = p.category === current.category ? 1 : 0;
      return { p, score: sameCat * 10 + overlap * 3, createdAt: p.createdAt ?? "" };
    })
    .sort((a, b) => b.score - a.score || +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, max)
    .map((s) => s.p);
}

/** 文章 openGraph 元数据组装（桌面/移动/平板 SEO 共用） */
export function postOgMeta(post: LegacyPost, siteUrl: string) {
  return {
    title: post.titleZh || post.title,
    description: post.excerptZh || post.excerpt,
    type: "article" as const,
    publishedTime: post.date,
    tags: post.tags,
    url: `${siteUrl}/posts/${post.id}`,
    siteName: "慢日志",
  };
}

/** 分类名本地化（移动端卡片/筛选；与桌面 catLabel 同规则） */
export function mCatLabel(cat: string, t: Dict): string {
  if (cat === "All") return t.catAll;
  if (cat === "Design") return t.catDesign;
  if (cat === "Build") return t.catBuild;
  if (cat === "Lab") return t.catLab;
  if (cat === "Found") return t.catFound;
  if (cat === "Log") return t.catLog;
  return cat;
}

/**
 * JSON-LD 安全序列化（P1-4）。
 *
 * `JSON.stringify` 不转义 `<`、`>`、`&`，而 JSON-LD 是通过
 * `dangerouslySetInnerHTML` 注入 `<script type="application/ld+json">` 的——
 * 标题若为 `</script><img src=x onerror=...>` 即可提前闭合脚本标签并执行任意脚本。
 * 转成 `\u003c` 等 Unicode 转义后 JSON 语义不变，但浏览器不再识别为标签边界。
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
