import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { ContentCategory } from "./categories";
import { markdownToHtml, extractHeadings, injectHeadingIds } from "./markdown";
import type { Lang } from "./i18n";
import { hasDatabase } from "./prisma";

export interface Post {
  id: string;
  title: string;
  titleZh: string;
  excerpt: string;
  excerptZh: string;
  category: ContentCategory;
  author: string;
  authorInitial: string;
  date: string;
  displayDate: string;
  readTime: string;
  featured?: boolean;
  draft?: boolean;
  tags: string[];
  markdown: string;
  markdownZh: string;
  html: string;
  htmlZh: string;
  headings: { id: string; text: string }[];
  headingsZh: { id: string; text: string }[];
  createdAt?: string;
}

const CONTENT_DIR = path.join(process.cwd(), "content", "posts");

function parseFile(filePath: string, id: string): Post {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;
  const markdown = parsed.content.trim();
  const markdownZh = String(data.contentZh ?? "").trim();
  const hasChinese = markdownZh.length > 0;
  const headings = extractHeadings(markdown);
  const headingsZh = hasChinese ? extractHeadings(markdownZh) : headings;
  const htmlRaw = markdownToHtml(markdown);
  const html = injectHeadingIds(htmlRaw);
  const htmlZh = hasChinese ? injectHeadingIds(markdownToHtml(markdownZh)) : html;
  return {
    id,
    title: String(data.title ?? ""),
    titleZh: String(data.titleZh ?? data.title ?? ""),
    excerpt: String(data.excerpt ?? ""),
    excerptZh: String(data.excerptZh ?? data.excerpt ?? ""),
    category: String(data.category ?? "Design") as ContentCategory,
    author: String(data.author ?? "Unknown"),
    authorInitial: String(data.authorInitial ?? "U"),
    date: String(data.date ?? new Date().toISOString().slice(0, 10)),
    displayDate: String(data.displayDate ?? String(data.date ?? "")),
    readTime: String(data.readTime ?? "5 min"),
    featured: Boolean(data.featured),
    draft: Boolean(data.draft),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    markdown,
    markdownZh: hasChinese ? markdownZh : markdown,
    html,
    htmlZh,
    headings,
    headingsZh,
    createdAt: String(data.date ?? new Date().toISOString()),
  };
}

function dbRowToPost(row: any): Post {
  const markdown = row.markdown ?? "";
  const markdownZh = row.markdownZh ?? markdown;
  const hasChinese = !!row.markdownZh;
  const headings = extractHeadings(markdown);
  const headingsZh = hasChinese ? extractHeadings(markdownZh) : headings;
  const html = injectHeadingIds(markdownToHtml(markdown));
  const htmlZh = hasChinese ? injectHeadingIds(markdownToHtml(markdownZh)) : html;
  return {
    id: row.id,
    title: row.title,
    titleZh: row.titleZh ?? row.title,
    excerpt: row.excerpt,
    excerptZh: row.excerptZh ?? row.excerpt,
    category: row.category as ContentCategory,
    author: row.author,
    authorInitial: row.authorInitial,
    date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date).slice(0, 10),
    displayDate: row.displayDate,
    readTime: row.readTime,
    featured: row.featured,
    draft: row.draft ?? false,
    tags: row.tags ?? [],
    markdown,
    markdownZh,
    html,
    htmlZh,
    headings,
    headingsZh,
    createdAt: row.createdAt ? (row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt)) : undefined,
  };
}

function getAllPostsFromFs(): Post[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  const posts = files.map((f) => {
    const id = f.replace(/\.md$/, "");
    return parseFile(path.join(CONTENT_DIR, f), id);
  });
  return posts.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime();
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime();
    return tb - ta;
  });
}

function getPostByIdFromFs(id: string): Post | undefined {
  const filePath = path.join(CONTENT_DIR, `${id}.md`);
  if (!fs.existsSync(filePath)) return undefined;
  return parseFile(filePath, id);
}

// Public API (hybrid)
export async function getAllPosts(): Promise<Post[]> {
  if (hasDatabase()) {
    try {
      const { prisma } = await import("./prisma");
      const rows = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });
      if (rows.length > 0) return rows.map(dbRowToPost);
    } catch (e: any) {
      if (e?.code === "P2022" || e?.message?.includes("does not exist")) {
        console.warn("[posts] DB schema mismatch (missing column?), falling back to fs. Run: npx prisma db push");
      } else {
        console.warn("[posts] DB error fetching all posts, fallback to fs:", e);
      }
    }
  }
  return getAllPostsFromFs();
}

export async function getPostById(id: string): Promise<Post | undefined> {
  if (hasDatabase()) {
    try {
      const { prisma } = await import("./prisma");
      const row = await prisma.post.findUnique({ where: { id } });
      if (row) return dbRowToPost(row);
    } catch (e: any) {
      if (e?.code === "P2022" || e?.message?.includes("does not exist")) {
        console.warn(`[posts] DB schema mismatch for post "${id}", falling back to fs`);
      } else {
        console.warn(`[posts] DB error fetching post "${id}", fallback to fs:`, e);
      }
    }
  }
  return getPostByIdFromFs(id);
}

export function getAllPostsSync(): Post[] {
  return getAllPostsFromFs();
}
export function getPostByIdSync(id: string): Post | undefined {
  return getPostByIdFromFs(id);
}

export async function getAllPostIds(): Promise<string[]> {
  if (hasDatabase()) {
    try {
      const { prisma } = await import("./prisma");
      const rows = await prisma.post.findMany({ select: { id: true } });
      if (rows.length > 0) return rows.map((r: { id: string }) => r.id);
    } catch (e: any) {
      if (e?.code === "P2022" || e?.message?.includes("does not exist")) {
        console.warn("[posts] DB schema mismatch for post IDs, falling back to fs");
      } else {
        console.warn("[posts] DB error fetching post IDs, fallback to fs:", e);
      }
    }
  }
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md")).map((f: string) => f.replace(/\.md$/, ""));
}

export function getLocalizedPost(post: Post, lang: Lang) {
  if (lang === "zh") {
    return {
      ...post,
      title: post.titleZh || post.title,
      excerpt: post.excerptZh || post.excerpt,
      markdown: post.markdownZh || post.markdown,
      html: post.htmlZh || post.html,
      headings: post.headingsZh || post.headings,
    };
  }
  return post;
}
