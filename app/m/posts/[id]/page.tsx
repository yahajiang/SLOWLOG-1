import { notFound } from "next/navigation";
import { getAllPosts, getPostById, getPostBySlug } from "@/lib/posts";
import { MPost } from "@/components/mobile/MPost";
import { adaptPost } from "@/lib/madapt";
import type { Metadata } from "next";

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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
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

  const allRaw = await getAllPosts();
  const all = allRaw.map((p) => adaptPost(p)!);
  const currentIdx = allRaw.findIndex((p) => p.id === id || (p as any).slug === id);
  const prevPost = currentIdx < all.length - 1 ? all[currentIdx + 1] : null;
  const nextPost = currentIdx > 0 ? all[currentIdx - 1] : null;

  return <MPost post={post} rawPost={raw} prevPost={prevPost} nextPost={nextPost} />;
}
