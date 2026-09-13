// 把重写后的 markdown 批量写回数据库（v0.3 内容重写专用）
// 用法：
//   node --env-file=.env scripts/apply-content.mjs <目录> [--dry] [--only <postId>]
//
// 约定：
//   - 目录下每个文件名为 `<postId>.md`，正文用扩展 markdown（见 scripts/lib/tiptap-md.mjs 头部）
//   - 文件可选 frontmatter（--- 包裹）支持 excerpt / excerptZh 覆盖；不写则保持库里原值
//   - 正文中的 ![img](#KEEP1) 占位符会被替换为该文章原有的第 1 个图片节点（保住 base64 图，不重传）
//   - 默认只改 content；--dry 只做转换与统计，不写库
import { PrismaClient } from "../lib/generated/prisma/client.js";
import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { markdownToTiptap, tiptapToMarkdown } from "./lib/tiptap-md.mjs";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith("--"));
const dry = args.includes("--dry");
const onlyIdx = args.indexOf("--only");
const only = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

if (!dir) {
  console.error("用法: node --env-file=.env scripts/apply-content.mjs <目录> [--dry] [--only <postId>]");
  process.exit(1);
}

function splitFrontmatter(md) {
  const m = /^---\n([\s\S]*?)\n---\n+([\s\S]*)$/.exec(md);
  if (!m) return { meta: {}, body: md };
  const meta = {};
  for (const line of m[1].split("\n")) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, "");
  }
  return { meta, body: m[2] };
}

/** 收集文档中所有 image 节点（深度优先） */
function collectImages(node, out = []) {
  if (!node || typeof node !== "object") return out;
  if (node.type === "image") out.push(node);
  for (const c of node.content || []) collectImages(c, out);
  return out;
}

function replaceKeep(doc, originals) {
  let used = 0;
  const walk = (n) => {
    for (const c of n.content || []) {
      if (c.type === "image" && typeof c.attrs?.src === "string" && /^#KEEP\d+$/.test(c.attrs.src)) {
        const idx = parseInt(c.attrs.src.slice(5), 10) - 1;
        const src = originals[idx];
        if (src) { c.attrs = { ...src.attrs, alt: c.attrs.alt || src.attrs?.alt || "" }; used++; }
      }
      walk(c);
    }
  };
  walk(doc);
  return used;
}

function countNodes(doc, acc = {}) {
  if (!doc || typeof doc !== "object") return acc;
  if (doc.type) acc[doc.type] = (acc[doc.type] || 0) + 1;
  for (const m of doc.marks || []) acc["mark:" + m.type] = (acc["mark:" + m.type] || 0) + 1;
  for (const c of doc.content || []) countNodes(c, acc);
  return acc;
}
const chars = (doc) => {
  let n = 0;
  const walk = (x) => { if (x?.type === "text" && x.text) n += x.text.replace(/\s+/g, "").length; for (const c of x?.content || []) walk(c); };
  walk(doc);
  return n;
};

async function main() {
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  const targets = only ? files.filter((f) => basename(f, ".md") === only) : files;
  console.log(`[apply] ${targets.length} 篇${dry ? "（dry-run，不写库）" : ""}\n`);

  const report = [];
  for (const f of targets) {
    const id = basename(f, ".md");
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) { console.log(`✗ ${id} 库中不存在，跳过`); continue; }

    const { meta, body } = splitFrontmatter(readFileSync(join(dir, f), "utf8"));
    const doc = markdownToTiptap(body);
    const originals = collectImages(post.content).map((n) => ({ attrs: n.attrs }));
    const kept = replaceKeep(doc, originals);

    const before = countNodes(post.content);
    const after = countNodes(doc);

    // 往返自检：新文档 → markdown → 再转回，全部节点/标记计数必须完全一致
    let roundTripOk = true;
    let rtDiff = "";
    try {
      const again = markdownToTiptap(tiptapToMarkdown(doc));
      const got = JSON.stringify(countNodes(again));
      const want = JSON.stringify(after);
      roundTripOk = got === want;
      if (!roundTripOk) rtDiff = `\n     期望 ${want}\n     实得 ${got}`;
    } catch (e) { roundTripOk = false; rtDiff = " " + e.message; }

    const added = Object.keys(after).filter((k) => !before[k]);
    const levels = (n) => Object.entries(n).filter(([k]) => k !== "text" && k !== "mark:" && !k.startsWith("mark:")).length;

    report.push({ id, title: post.titleZh || post.title, before: chars(post.content), after: chars(doc), added, roundTripOk, kept, origImgs: originals.length });

    if (!dry) {
      const data = { content: doc };
      if (meta.excerpt) data.excerpt = meta.excerpt;
      if (meta.excerptZh) data.excerptZh = meta.excerptZh;
      await prisma.post.update({ where: { id }, data });
    }
    console.log(`✓ ${(post.titleZh || post.title).slice(0, 24).padEnd(26)} ${String(chars(post.content)).padStart(5)}→${String(chars(doc)).padStart(5)}字  新增节点:${added.length ? added.join(",") : "无"}  图:${originals.length}(引用${kept})  往返:${roundTripOk ? "ok" : "FAIL"}${rtDiff}`);
  }

  const totalBefore = report.reduce((s, r) => s + r.before, 0);
  const totalAfter = report.reduce((s, r) => s + r.after, 0);
  console.log(`\n合计 ${report.length} 篇：${totalBefore} → ${totalAfter} 字（${totalAfter >= totalBefore ? "+" : ""}${totalAfter - totalBefore}）`);
  const bad = report.filter((r) => !r.roundTripOk);
  if (bad.length) console.log(`⚠️ 往返自检失败：${bad.map((b) => b.id).join(", ")}`);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error("ERR:", e.message); await prisma.$disconnect(); process.exit(1); });
