// 内容备份（v0.3 P0-4）：导出六表 JSON 到 backups/。
// 用法：node --env-file=.env scripts/backup.mjs
// 密码字段永不导出（安全边界）；恢复 = 以 JSON 为源重建数据（README 写步骤）。
import { PrismaClient } from "../lib/generated/prisma/client.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();
const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
const dir = join(process.cwd(), "backups");

async function main() {
  mkdirSync(dir, { recursive: true });
  console.log("[backup] exporting…");

  const [users, categories, posts, notes, media, settings] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, email: true, name: true, createdAt: true },
    }),
    prisma.category.findMany(),
    prisma.post.findMany({ include: { category: true } }),
    prisma.note.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.media.findMany(),
    prisma.setting.findMany(),
  ]);

  const payload = {
    meta: { version: "0.3", exportedAt: new Date().toISOString(), counts: { users: users.length, categories: categories.length, posts: posts.length, notes: notes.length, media: media.length, settings: settings.length } },
    users,
    categories,
    posts,
    notes,
    media,
    settings,
  };

  const file = join(dir, `backup-${stamp}.json`);
  writeFileSync(file, JSON.stringify(payload, null, 2));
  const kb = Math.round(JSON.stringify(payload).length / 1024);
  console.log(`[backup] ok -> backups/backup-${stamp}.json (${kb} KB, posts=${posts.length}, notes=${notes.length})`);
}

main()
  .catch((e) => { console.error("[backup] failed:", e.message); process.exit(1) })
  .finally(() => prisma.$disconnect());
