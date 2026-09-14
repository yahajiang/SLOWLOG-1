import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPosts } from "@/lib/posts";
import { TagClient } from "./TagClient";

// 标签聚合页（v0.3 P1-7）：/tag/[tag]——文章页底部标签可点击进入。
// 服务端取数 + notFound；刊头/列表/相关标签交给 TagClient（客户端本地化）。
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const name = decodeURIComponent(tag);
  return { title: `#${name}`, description: `标签「${name}」下的全部文章` };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const name = decodeURIComponent(tag);
  const all = await getAllPosts();
  const hits = all
    .filter((p) => (p.tags || []).some((x) => x.toLowerCase() === name.toLowerCase()))
    .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());

  if (hits.length === 0) notFound();

  // 相关标签：命中文章的共现标签（去除自身），按出现次数取前 10
  const freq = new Map<string, number>();
  for (const p of hits) {
    for (const tg of p.tags || []) {
      const key = String(tg).trim();
      if (!key || key.toLowerCase() === name.toLowerCase()) continue;
      freq.set(key, (freq.get(key) || 0) + 1);
    }
  }
  const related = [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([k]) => k);

  const items = hits.map((p) => ({
    id: p.id,
    title: p.title,
    titleZh: p.titleZh ?? null,
    category: String(p.category),
    readTime: p.readTime ?? null,
    date: new Date(p.publishedAt || p.createdAt).toISOString(),
  }));

  return <TagClient tagName={name} items={items} related={related} />;
}
