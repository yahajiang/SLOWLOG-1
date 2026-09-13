// 类目重构迁移 2026-09-14：7 旧类目 → 5 新类目（Design/Build/Lab/Found/Log）
// 映射定案（用户确认）：封面系统→Design；编辑器+Tauri+9 个 QQ 工具插件→Build；SoulSync 心旅系列 5 篇→Lab
// 特性：前置安全校验（id 全集比对）+ 幂等（upsert / updateMany）
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

const TARGETS = [
  { name: "Design", nameZh: "设计", slug: "design", description: "Posters, typography, visual communication, UI", descriptionZh: "海报、排版、字体、视觉传达、UI" },
  { name: "Build", nameZh: "开发", slug: "build", description: "Frontend, Python, plugins, websites", descriptionZh: "前端、Python、插件、网站制作" },
  { name: "Lab", nameZh: "实验", slug: "lab", description: "AI, interaction, visual experiments and new things", descriptionZh: "AI、交互、视觉实验、各种新东西" },
  { name: "Found", nameZh: "发现", slug: "found", description: "Good sites, assets, tools, inspiration, cases", descriptionZh: "好网站、素材、工具、灵感、案例" },
  { name: "Log", nameZh: "记录", slug: "log", description: "Learning, travel, life, notes", descriptionZh: "学习、旅行、生活、随笔" },
];

const MAP = {
  design: ["cmtlkb5qi0003l204sn0gxbv2"], // 每篇文章都值得一张脸：规则派生的封面系统
  build: [
    "cmthlnh5g0003tq2coyud4oi6", // Tauri 2 + React 19 打印助手
    "cmtlkb4xz0001l204y8cyquec", // 左写右读：编辑器
    "cmtzi1imi0001tqe45tud5aqt", // 反戳
    "cmtzi1iro0003tqe49vdc8isv", // 爱点赞
    "cmtzi1iwa0005tqe4pot4ge4p", // 签到
    "cmtzi1j0v0007tqe4z7q4txay", // imgtool 生图冷却
    "cmtzi1j5o0009tqe4ysqmy1y3", // token 三层闸门
    "cmtzi1jae000btqe4wnnh5inu", // 定时暂停 LLM
    "cmtzi1jfh000dtqe4p9cniez5", // QQ 空间
    "cmtzi1jkf000ftqe4usc8nogn", // 网易云点歌
    "cmtzi1jp8000htqe4xrwxh9cx", // 语音通话
  ],
  lab: [
    "cmthlnguo0001tq2cbnjp9d4t", // SoulSync 情感引擎
    "cmti9870j0001tqjg04bfxkgd", // 心旅小馆
    "cmti987gb0003tqjg1ppcqszi", // 心镜·启明
    "cmti987nq0005tqjggt47i5q5", // 心旅知音·注入防护盾
    "cmti987si0007tqjgy3mkq2ra", // 菜单图片 Pillow
  ],
};
const OBSOLETE = ["plugin", "engineering", "typography", "frontend", "snippet", "life"];

async function main() {
  const pool = new Pool({ connectionString: loadEnvDb() });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  // 0) 安全校验：映射与库内 id 全集必须严格一致（一个不漏、一个不重）
  const all = await prisma.post.findMany({ select: { id: true, titleZh: true, status: true } });
  const allIds = new Set(all.map((p) => p.id));
  const mapped = Object.values(MAP).flat();
  const missing = mapped.filter((id) => !allIds.has(id));
  const dup = mapped.filter((id, i) => mapped.indexOf(id) !== i);
  const unmapped = [...allIds].filter((id) => !mapped.includes(id));
  if (missing.length || dup.length || unmapped.length) {
    console.error("✗ 映射校验失败", { missing, dup, unmapped });
    process.exit(1);
  }
  console.log(`✓ 校验通过：库内 ${all.length} 篇 = 映射 ${mapped.length} 篇（design ${MAP.design.length} / build ${MAP.build.length} / lab ${MAP.lab.length}）`);

  // 1) upsert 5 个目标类目
  const bySlug = {};
  for (const c of TARGETS) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameZh: c.nameZh, description: c.description, descriptionZh: c.descriptionZh },
      create: c,
    });
    bySlug[c.slug] = row.id;
  }
  console.log("✓ 目标类目就绪：", TARGETS.map((c) => c.slug).join(", "));

  // 2) 重挂文章
  let totalMoved = 0;
  for (const [slug, ids] of Object.entries(MAP)) {
    const r = await prisma.post.updateMany({ where: { id: { in: ids } }, data: { categoryId: bySlug[slug] } });
    totalMoved += r.count;
    console.log(`  → ${slug}: ${r.count}/${ids.length} 篇${r.count === ids.length ? " ✓" : " ✗"}`);
    if (r.count !== ids.length) process.exit(1);
  }

  // 3) 删除旧类目（逐个确认零引用后再删）
  for (const slug of OBSOLETE) {
    const cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) continue;
    const n = await prisma.post.count({ where: { categoryId: cat.id } });
    if (n > 0) {
      console.warn(`  ! ${slug} 仍有 ${n} 篇引用，跳过删除`);
      continue;
    }
    await prisma.category.delete({ where: { id: cat.id } });
    console.log(`  ✗ 已删除旧类目 ${slug}`);
  }

  // 4) 终态
  console.log("\n=== 迁移后终态 ===");
  const cats = await prisma.category.findMany({ orderBy: { createdAt: "asc" } });
  for (const c of cats) {
    const n = await prisma.post.count({ where: { categoryId: c.id } });
    console.log(`  ${c.name.padEnd(8)} ${c.nameZh}  posts=${n}`);
  }

  await prisma.$disconnect();
  await pool.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
