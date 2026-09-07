// 内容导入（v0.3 P2）：content-export/*.md 或任意目录的 .md → 博客文章（草稿）。
// 用法：node --env-file=.env scripts/import-md.mjs [目录]（默认 content-export/）
// 行为：**默认存在即跳过（永不覆盖线上内容！）**——加 --force 才更新。
//       导入一律落为 draft——发布动作留给后台人工确认（安全边界）。
//       ⚠️ MD 往返是有损的（表格/对齐/字色等富文本降级），切勿对线上文章做覆盖更新。
import { PrismaClient } from "../lib/generated/prisma/client.js";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { markdownToTiptap } from "./lib/tiptap-md.mjs";

const prisma = new PrismaClient();
const dir = process.argv[2] ? join(process.cwd(), process.argv[2]) : join(process.cwd(), "content-export");

function parseFrontmatter(md) {
  const m = /^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/.exec(md);
  if (!m) return { meta: {}, body: md };
  const meta = {};
  for (const line of m[1].split("\n")) {
    const kv = /^(\w+):\s*"?(.*?)"?\s*$/.exec(line);
    if (kv) meta[kv[1]] = kv[2];
  }
  return { meta, body: m[2] };
}

function defaultCategory() {
  return prisma.category.findFirst().then((c) => c?.id);
}

async function main() {
  const catId = await defaultCategory();
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  console.log(`[import] ${files.length} files from ${dir}`);

  let created = 0, updated = 0, skipped = 0;
  for (const f of files) {
    const md = readFileSync(join(dir, f), "utf8");
    const { meta, body } = parseFrontmatter(md);
    const title = meta.title || meta.titleEn || f.replace(/\.md$/, "");
    const titleZh = meta.title || title;
    const slug = meta.slug || f.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
    const content = markdownToTiptap(body);

    const exists = await prisma.post.findUnique({ where: { slug }, select: { id: true } });
    const data = {
      title, titleZh,
      slug,
      excerpt: meta.excerpt || "",
      excerptZh: meta.excerpt || "",
      content,
      categoryId: meta.category ? undefined : catId,
      tags: meta.tags ? meta.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      status: meta.status === "published" ? "published" : "draft",
      readTime: meta.readTime || null,
    };
    // 分类解析：按 categoryName 匹配，失败用默认
    if (meta.category) {
      const cat = await prisma.category.findFirst({ where: { name: meta.category } });
      if (cat) data.categoryId = cat.id;
    }

    if (exists && !process.argv.includes("--force")) {
      skipped++;
      console.log(`  skipped (已存在): ${slug}`);
    } else if (exists) {
      await prisma.post.update({ where: { slug }, data });
      updated++;
      console.log(`  updated: ${slug}`);
    } else {
      await prisma.post.create({ data: { ...data, slug, author: "Yahajiang" } });
      created++;
      console.log(`  created: ${slug}`);
    }
  }
  console.log(`[import] done — created=${created} updated=${updated} skipped=${skipped}`);
}

main()
  .catch((e) => { console.error("[import] failed:", e.message); process.exit(1) })
  .finally(() => prisma.$disconnect());
