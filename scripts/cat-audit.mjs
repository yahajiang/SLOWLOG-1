// 类目审计：列出 Category 表与全部文章的分类归属（供 2026-09-14 类目重构）
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "../lib/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function loadEnvDb() {
  const p = path.join(ROOT, ".env");
  const line = fs
    .readFileSync(p, "utf8")
    .replace(/^\ufeff/, "")
    .split(/\r?\n/)
    .find((l) => l.includes("DATABASE_URL="));
  return line?.split("DATABASE_URL=")[1]?.trim().replace(/^"|"$/g, "");
}

const pool = new Pool({ connectionString: loadEnvDb() });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const cats = await prisma.category.findMany({ orderBy: { createdAt: "asc" } });
console.log("=== Category 表（" + cats.length + " 个）===");
for (const c of cats) {
  const n = await prisma.post.count({ where: { categoryId: c.id } });
  console.log(`  ${c.name.padEnd(14)} nameZh=${(c.nameZh || "-").padEnd(6)} slug=${c.slug.padEnd(14)} posts=${n}`);
}

const posts = await prisma.post.findMany({
  orderBy: [{ createdAt: "asc" }],
  select: { id: true, title: true, titleZh: true, status: true, categoryId: true, tags: true },
});
console.log("\n=== 文章（" + posts.length + " 篇）===");
const catById = Object.fromEntries(cats.map((c) => [c.id, c.name]));
for (const p of posts) {
  const cat = p.categoryId ? catById[p.categoryId] || "?" : "(无)";
  console.log(`  [${cat.padEnd(12)}] ${(p.titleZh || p.title).slice(0, 34).padEnd(36)} tags=${JSON.stringify(p.tags)}`);
  console.log(`      id=${p.id} status=${p.status}`);
}

const out = {
  categories: cats.map((c) => ({ id: c.id, name: c.name, nameZh: c.nameZh, slug: c.slug })),
  posts: posts.map((p) => ({ ...p, categoryName: p.categoryId ? catById[p.categoryId] : null })),
};
const outPath = "C:/Users/Yahajiang/AppData/Local/Temp/slowlog-cats/audit.json";
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log("\nJSON →", outPath);

await prisma.$disconnect();
await pool.end();
