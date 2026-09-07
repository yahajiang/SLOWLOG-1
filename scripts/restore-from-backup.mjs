// 从最近备份恢复 posts 的 content（MD 往返覆盖事故的修复工具）
import { PrismaClient } from "../lib/generated/prisma/client.js";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
const prisma = new PrismaClient();
const dir = join(process.cwd(), "backups");
const latest = readdirSync(dir).filter(f => f.endsWith(".json")).sort().pop();
const backup = JSON.parse(readFileSync(join(dir, latest), "utf8"));
console.log("[restore] from", latest);
let n = 0;
for (const p of backup.posts) {
  await prisma.post.update({ where: { id: p.id }, data: { content: p.content, excerpt: p.excerpt, excerptZh: p.excerptZh, title: p.title, titleZh: p.titleZh, updatedAt: new Date() } });
  n++;
}
console.log("[restore] ok —", n, "posts restored");
await prisma.$disconnect();
