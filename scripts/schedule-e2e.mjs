// 定时发布 E2E（只读+可逆改写）：publishedAt 设未来 → 前台列表消失 → 恢复
import { PrismaClient } from "../lib/generated/prisma/client.js";
const prisma = new PrismaClient();
const PID = "cmtlkb4xz0001l204y8cyquec";

async function main() {
  const orig = await prisma.post.findUnique({ where: { id: PID }, select: { publishedAt: true, status: true } });
  console.log("orig:", orig.publishedAt, orig.status);

  // 设为未来 1 年
  await prisma.post.update({ where: { id: PID }, data: { publishedAt: new Date(Date.now() + 365 * 86400000) } });
  // 直接用与 lib 相同的过滤查询验证
  const visNow = await prisma.post.findMany({
    where: { status: "published", OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }] },
    select: { id: true },
  });
  console.log("future-scheduled visible in query:", visNow.some((p) => p.id === PID) ? "YES(bad)" : "NO(correct)");

  // 恢复
  await prisma.post.update({ where: { id: PID }, data: { publishedAt: orig.publishedAt } });
  const restored = await prisma.post.findUnique({ where: { id: PID }, select: { publishedAt: true } });
  console.log("restored:", restored.publishedAt, "match:", restored.publishedAt?.getTime() === orig.publishedAt?.getTime());
}
main().finally(() => prisma.$disconnect());
