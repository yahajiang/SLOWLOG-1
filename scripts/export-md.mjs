// 内容导出（v0.3 P2）：全部已发布+草稿文章 → content-export/*.md
// 用法：node --env-file=.env scripts/export-md.mjs
// 每篇 = frontmatter（元信息）+ Tiptap JSON → Markdown 正文。内容资产平台无关。
import { PrismaClient } from "../lib/generated/prisma/client.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tiptapToMarkdown } from "./lib/tiptap-md.mjs";

const prisma = new PrismaClient();
const dir = join(process.cwd(), "content-export");

function fmEscape(s) { return String(s ?? "").replace(/"/g, "'") }

async function main() {
  mkdirSync(dir, { recursive: true });
  const posts = await prisma.post.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  console.log(`[export] ${posts.length} posts…`);

  let n = 0;
  for (const p of posts) {
    const date = (p.publishedAt || p.createdAt || new Date()).toISOString().slice(0, 10);
    const slug = p.slug || p.id;
    const file = join(dir, `${date}-${slug}.md`);

    const fm = [
      "---",
      `title: "${fmEscape(p.titleZh || p.title)}"`,
      p.titleZh && p.title ? `titleEn: "${fmEscape(p.title)}"` : null,
      `slug: "${slug}"`,
      `date: "${date}"`,
      `category: "${fmEscape(p.category?.name || "Design")}"`,
      p.tags?.length ? `tags: [${p.tags.map(fmEscape).join(", ")}]` : null,
      p.excerptZh || p.excerpt ? `excerpt: "${fmEscape(p.excerptZh || p.excerpt).slice(0, 160)}"` : null,
      `status: "${p.status}"`,
      p.readTime ? `readTime: "${fmEscape(p.readTime)}"` : null,
      p.featured ? "featured: true" : null,
      "---",
    ].filter(Boolean).join("\n");

    const body = tiptapToMarkdown(p.content);
    writeFileSync(file, fm + "\n\n" + body + "\n");
    n++;
  }
  console.log(`[export] ok -> content-export/ (${n} files)`);
}

main()
  .catch((e) => { console.error("[export] failed:", e.message); process.exit(1) })
  .finally(() => prisma.$disconnect());
