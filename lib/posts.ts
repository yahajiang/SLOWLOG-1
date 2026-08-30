import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { ContentCategory } from "./categories";
import { markdownToHtml, extractHeadings, injectHeadingIds } from "./markdown";
import type { Lang } from "./i18n";

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
  tags: string[];
  markdown: string;
  markdownZh: string;
  html: string;
  htmlZh: string;
  headings: { id: string; text: string }[];
  headingsZh: { id: string; text: string }[];
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
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    markdown,
    markdownZh: hasChinese ? markdownZh : markdown,
    html,
    htmlZh,
    headings,
    headingsZh,
  };
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  const posts = files.map((f) => {
    const id = f.replace(/\.md$/, "");
    return parseFile(path.join(CONTENT_DIR, f), id);
  });
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostById(id: string): Post | undefined {
  const filePath = path.join(CONTENT_DIR, `${id}.md`);
  if (!fs.existsSync(filePath)) return undefined;
  return parseFile(filePath, id);
}

export function getAllPostIds(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""));
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
