import { notFound } from "next/navigation";
import { getAllPosts, getPostById, getPostBySlug } from "@/lib/posts";
import { MPost } from "@/components/mobile/MPost";
import { adaptPost } from "@/lib/madapt";
import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.slice(0, 20).map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const raw = (await getPostBySlug(id)) || (await getPostById(id));
  if (!raw) return { title: "文章未找到" };
  const post = adaptPost(raw)!;
  const siteUrl = await getSiteUrl();
  return {
    title: post.titleZh || post.title,
    description: post.excerptZh || post.excerpt,
    alternates: { canonical: `${siteUrl}/posts/${post.id}` },
    openGraph: {
      title: post.titleZh || post.title,
      description: post.excerptZh || post.excerpt,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
      url: `${siteUrl}/posts/${post.id}`,
      siteName: "慢日志",
    },
  };
}

export default async function MobilePostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = (await getPostBySlug(id)) || (await getPostById(id));
  if (!raw) notFound();
  const post = adaptPost(raw)!;

  // 按发布时间排序，算出纵向上下篇（桌面是横向）
  const allRaw = await getAllPosts();
  const sorted = [...allRaw].sort((a, b) => {
    const da = new Date((a as any).publishedAt || (a as any).createdAt || (a as any).date || 0).getTime();
    const db = new Date((b as any).publishedAt || (b as any).createdAt || (b as any).date || 0).getTime();
    return db - da;
  });
  const idx = sorted.findIndex((p) => p.id === post.id);
  const prev = idx > 0 ? adaptPost(sorted[idx - 1]) : null;
  const next = idx >= 0 && idx < sorted.length - 1 ? adaptPost(sorted[idx + 1]) : null;

  return <MPost post={post} rawPost={raw} prev={prev} next={next} />;
}
