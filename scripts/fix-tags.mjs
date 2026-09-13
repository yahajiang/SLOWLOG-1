// 脏标签数据修复（2026-09-14）：修复导入期遗留的 "[Python" / "插件开发]" 式方括号污染
// 逻辑与 scripts/import-md.mjs parseTags 同源：逐项 trim + 剥首尾 []，去重、滤空
// 用法：node scripts/fix-tags.mjs [--dry]
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "../lib/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const dry = process.argv.includes("--dry");

function loadEnvDb() {
  const p = path.join(ROOT, ".env");
  const line = fs
    .readFileSync(p, "utf8")
    .replace(/^\ufeff/, "")
    .split(/\r?\n/)
    .find((l) => l.includes("DATABASE_URL="));
  return line?.split("DATABASE_URL=")[1]?.trim().replace(/^"|"$/g, "");
}

/** 与 import-md.mjs parseTags 同源的清洗逻辑 */
function cleanTags(tags) {
  const out = [];
  for (const raw of tags || []) {
    const t = String(raw).trim().replace(/^\[+|\]+$/g, "").trim();
    if (t && !out.includes(t)) out.push(t);
  }
  return out;
}

const pool = new Pool({ connectionString: loadEnvDb() });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const posts = await prisma.post.findMany({ select: { id: true, titleZh: true, title: true, tags: true }, orderBy: { createdAt: "asc" } });
let changed = 0, fixedTags = 0;
for (const p of posts) {
  const cleaned = cleanTags(p.tags);
  const same = cleaned.length === p.tags.length && cleaned.every((t, i) => t === p.tags[i]);
  if (same) continue;
  changed++; fixedTags += p.tags.length - cleaned.length + p.tags.filter((t, i) => t !== cleaned[i]).length;
  console.log(`\n[${dry ? "dry" : "fix"}] ${(p.titleZh || p.title).slice(0, 30)}`);
  console.log(`  before: ${JSON.stringify(p.tags)}`);
  console.log(`  after : ${JSON.stringify(cleaned)}`);
  if (!dry) await prisma.post.update({ where: { id: p.id }, data: { tags: cleaned } });
}
console.log(`\n${dry ? "（dry-run，未写库）" : "已写库"} 共 ${posts.length} 篇，需修复 ${changed} 篇`);

await prisma.$disconnect();
await pool.end();
