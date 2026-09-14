// 直连 DB 发布 content-export 2026-09-12 文章 → Prisma Post (published)
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
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .find((l) => l.includes("DATABASE_URL="));
  return line?.split("DATABASE_URL=")[1]?.trim().replace(/^"|"$/g, "");
}

/** 极简 MD → TipTap-like JSON（heading / paragraph / bulletList） */
function mdToTiptap(md) {
  const body = md
    .replace(/^---[\s\S]*?---\s*/, "")
    .replace(/^> [^\n]*\n?/gm, (m) => m)
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
  const lines = body.split(/\r?\n/);
  const content = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^#{2,4}\s+/.test(line)) {
      const level = Math.min(4, (line.match(/^#+/) || ["##"])[0].length);
      const text = line.replace(/^#{2,4}\s+/, "").trim();
      content.push({
        type: "heading",
        attrs: { level },
        content: [{ type: "text", text }],
      });
      i++;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const t = lines[i].replace(/^\s*[-*]\s+/, "").trim();
        items.push({
          type: "listItem",
          content: [{ type: "paragraph", content: t ? [{ type: "text", text: t }] : [] }],
        });
        i++;
      }
      content.push({ type: "bulletList", content: items });
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    // 段落（吞连续非空/非特殊行）
    let text = line.trim();
    i++;
    while (i < lines.length && lines[i].trim() && !/^#{2,4}\s+/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i])) {
      text += " " + lines[i].trim();
      i++;
    }
    content.push({
      type: "paragraph",
      content: text ? [{ type: "text", text: text.replace(/\*\*/g, "") }] : [],
    });
  }
  if (!content.length) {
    content.push({ type: "paragraph", content: [{ type: "text", text: "（空）" }] });
  }
  return { type: "doc", content };
}

const ARTICLES = [
  {
    file: "2026-09-12-anti-poke.md",
    slug: "astrbot-anti-poke",
    title: "被戳就戳回去：AstrBot 反戳插件",
    titleZh: "被戳就戳回去：AstrBot 反戳插件",
    excerpt: "五秒冷却，把 QQ 戳一戳从打扰变成礼仪。",
    tags: ["AstrBot", "QQ", "插件", "反戳"],
    category: "Build",
  },
  {
    file: "2026-09-12-furry-zan.md",
    slug: "astrbot-furry-zan",
    title: "自动点赞不是刷屏：AstrBot 爱点赞插件",
    titleZh: "自动点赞不是刷屏：AstrBot 爱点赞插件",
    excerpt: "每日定时 +「赞我」手动触发 + 黑名单，把点赞做成可预期的礼仪。",
    tags: ["AstrBot", "QQ", "插件", "点赞"],
    category: "Build",
  },
  {
    file: "2026-09-12-group-checkin.md",
    slug: "astrbot-group-checkin",
    title: "真签到，不用记得点：QQ 群签到插件",
    titleZh: "真签到，不用记得点：QQ 群签到插件",
    excerpt: "OneBot set_group_sign + 定时任务 + 防风控间隔，把仪式交给日程。",
    tags: ["AstrBot", "QQ", "签到", "插件"],
    category: "Build",
  },
  {
    file: "2026-09-12-imgtool-cooldown.md",
    slug: "astrbot-imgtool-cooldown",
    title: "别把生图额度当弹幕：imgtool 生图冷却",
    titleZh: "别把生图额度当弹幕：imgtool 生图冷却",
    excerpt: "给 /img 按用户冷却，超时才放行——省额度，也省队列。",
    tags: ["AstrBot", "生图", "限流", "插件"],
    category: "Build",
  },
  {
    file: "2026-09-12-token-controller.md",
    slug: "astrbot-token-controller",
    title: "token 三层闸门：AstrBot Token 流量控制",
    titleZh: "token 三层闸门：AstrBot Token 流量控制",
    excerpt: "群 / 人 / 私聊配额，超限停用或阶梯降级，再配缓存与上下文策略。",
    tags: ["AstrBot", "LLM", "限流", "token"],
    category: "Build",
  },
  {
    file: "2026-09-12-pause-schedule.md",
    slug: "astrbot-pause-schedule",
    title: "该闭嘴时闭嘴：定时暂停 LLM 服务",
    titleZh: "该闭嘴时闭嘴：定时暂停 LLM 服务",
    excerpt: "跨天时段 + WebUI 时间轴，把机器人作息写进配置而不是记性。",
    tags: ["AstrBot", "定时", "运维", "插件"],
    category: "Build",
  },
  {
    file: "2026-09-12-qzone.md",
    slug: "astrbot-qzone",
    title: "不止发动态：QQ 空间插件在 AstrBot 里怎么活",
    titleZh: "不止发动态：QQ 空间插件在 AstrBot 里怎么活",
    excerpt: "Cookie 绑定 + 本地 daemon + 投稿审核 + AI 评说说，把空间做成可治理的对外窗口。",
    tags: ["AstrBot", "QQ空间", "插件"],
    category: "Build",
  },
  {
    file: "2026-09-12-netease-music.md",
    slug: "astrbot-netease-music",
    title: "网易云点歌进群聊：自然语言 + 代理支持",
    titleZh: "网易云点歌进群聊：自然语言 + 代理支持",
    excerpt: "说歌名就出歌；海外用户可配 HTTP/SOCKS 代理。",
    tags: ["AstrBot", "音乐", "网易云", "插件"],
    category: "Build",
  },
  {
    file: "2026-09-12-voice-call.md",
    slug: "astrbot-voice-call",
    title: "不是发语音，是打电话：AstrBot 语音通话",
    titleZh: "不是发语音，是打电话：AstrBot 语音通话",
    excerpt: "浏览器 WebRTC + WebSocket + MiMo TTS，点链接就能和 AI 实时通话。",
    tags: ["AstrBot", "语音", "TTS", "插件"],
    category: "Build",
  },
  {
    file: "2026-09-12-moukit.md",
    slug: "moukit-offline-converter",
    title: "离线的格式瑞士军刀：MouKit",
    titleZh: "离线的格式瑞士军刀：MouKit",
    excerpt: "毛玻璃界面 + 内置转换引擎，文件不上传云端也能转。",
    tags: ["MouKit", "Windows", "工具", "离线"],
    category: "Found",
  },
];

function estimateReadTime(text) {
  const chars = (text || "").replace(/\s/g, "").length;
  const mins = Math.max(1, Math.round(chars / 300));
  return `${mins} min`;
}

async function main() {
  const connectionString = loadEnvDb();
  if (!connectionString) throw new Error("DATABASE_URL missing");
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false }, max: 3, connectionTimeoutMillis: 15000 });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const cats = await prisma.category.findMany();
  const byName = new Map(cats.map((c) => [c.name, c.id]));
  console.log("categories:", cats.map((c) => `${c.name}=${c.slug}`).join(", "));

  let ok = 0;
  let skip = 0;
  for (const a of ARTICLES) {
    const mdPath = path.join(ROOT, "content-export", a.file);
    if (!fs.existsSync(mdPath)) {
      console.error("missing", a.file);
      skip++;
      continue;
    }
    const md = fs.readFileSync(mdPath, "utf8");
    const content = mdToTiptap(md);
    const plain = md.replace(/^#{1,4} [^\n]+\n?/gm, "").replace(/\*\*/g, "").replace(/[`>#]/g, "").trim();
    const excerpt = a.excerpt || plain.slice(0, 80);
    const exist = await prisma.post.findUnique({ where: { slug: a.slug } });
    if (exist) {
      console.log("exists, update", a.slug);
      await prisma.post.update({
        where: { id: exist.id },
        data: {
          title: a.title,
          titleZh: a.titleZh,
          excerpt,
          excerptZh: excerpt,
          content,
          status: "published",
          tags: a.tags,
          categoryId: byName.get(a.category) || null,
          readTime: estimateReadTime(plain),
          publishedAt: exist.publishedAt ?? new Date(),
          updatedAt: new Date(),
        },
      });
      ok++;
      continue;
    }
    await prisma.post.create({
      data: {
        title: a.title,
        titleZh: a.titleZh,
        slug: a.slug,
        excerpt,
        excerptZh: excerpt,
        content,
        status: "published",
        tags: a.tags,
        categoryId: byName.get(a.category) || null,
        readTime: estimateReadTime(plain),
        author: "Yahajiang",
        authorInitial: "Y",
        featured: false,
        publishedAt: new Date(),
      },
    });
    console.log("created", a.slug);
    ok++;
  }
  console.log(`done ok=${ok} skip=${skip}`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
