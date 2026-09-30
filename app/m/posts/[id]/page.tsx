import { notFound } from "next/navigation";
import { getAllPosts, getPostById, getPostBySlug } from "@/lib/posts";
import { MPost } from "@/components/mobile/MPost";
import { adaptLegacyPost, pickAdjacent, postOgMeta } from "@/lib/adapt";
import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { getSettings } from "@/lib/settings";

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
  const post = adaptLegacyPost(raw)!;
  const siteUrl = await getSiteUrl();
  const site = await getSettings();
  return {
    title: post.titleZh || post.title,
    description: post.excerptZh || post.excerpt,
    alternates: { canonical: `${siteUrl}/posts/${post.id}` },
    openGraph: postOgMeta(post, siteUrl, site.siteName),
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
  const post = adaptLegacyPost(raw)!;

  // 上/下篇：与桌面、平板共用 lib/adapt 的同一实现，这一端排成纵向
  const all = (await getAllPosts()).map(adaptLegacyPost);
  const { prev, next } = pickAdjacent(all, post);

  return <MPost post={post} rawPost={raw} prev={prev} next={next} />;
}
