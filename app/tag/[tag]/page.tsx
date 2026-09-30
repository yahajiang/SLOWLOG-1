import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostsPage, getRelatedTags, FRONT_PAGE_SIZE_MAX } from "@/lib/posts";
import { getSettings } from "@/lib/settings";
import { TagClient } from "./TagClient";
import { getSiteUrlSync } from "@/lib/site-url";

// 标签聚合页（v0.3 P1-7）：/tag/[tag]——文章页底部标签可点击进入。
// 服务端取数 + notFound；刊头/列表/相关标签交给 TagClient（客户端本地化）。
// v0.5：改为服务端分页（?page=，每页最多 FRONT_PAGE_SIZE_MAX 篇）。
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const name = decodeURIComponent(tag);
  return {
    title: `#${name}`,
    description: `标签「${name}」下的全部文章`,
    // 固定成编码后的唯一形态：同一标签可能以「CSS 变量 / CSS%20变量 / css 变量」被爬到
    alternates: { canonical: `${getSiteUrlSync()}/tag/${encodeURIComponent(name)}` },
  };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { tag } = await params;
  const sp = await searchParams;
  const name = decodeURIComponent(tag);
  const requested = Math.max(1, Number(sp.page) || 1);

  const settings = await getSettings();
  const pageSize = Math.min(settings.postsPerPage || FRONT_PAGE_SIZE_MAX, FRONT_PAGE_SIZE_MAX);

  const [first, related] = await Promise.all([
    getPostsPage({ tag: name, page: requested, pageSize }),
    getRelatedTags(name),
  ]);
  // ?page= 指到范围外时不给空白卡：total>0 说明标签本身有文章，回落到最后一页
  const pageData =
    first.items.length === 0 && first.total > 0 && requested > 1
      ? await getPostsPage({ tag: name, page: Math.max(1, Math.ceil(first.total / pageSize)), pageSize })
      : first;

  if (pageData.total === 0) notFound();

  const items = pageData.items.map((p) => ({
    id: p.id,
    title: p.title,
    titleZh: p.titleZh ?? null,
    category: String(p.category),
    readTime: p.readTime ?? null,
    date: new Date(p.publishedAt || p.createdAt).toISOString(),
  }));

  return (
    <TagClient
      tagName={name}
      items={items}
      related={related}
      page={pageData.page}
      totalPages={pageData.totalPages}
      total={pageData.total}
    />
  );
}
