import { notFound } from "next/navigation";
import { getAllPosts, getPostById } from "@/lib/posts";
import { PostClient } from "@/components/PostClient";
import { LangProvider } from "@/lib/lang-context";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return { title: "文章未找到" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  const all = await getAllPosts();
  const currentIdx = all.findIndex((p) => p.id === id);
  const prevPost = currentIdx < all.length - 1 ? all[currentIdx + 1] : null;
  const nextPost = currentIdx > 0 ? all[currentIdx - 1] : null;

  return (
    <LangProvider>
      <PostClient post={post} prevPost={prevPost} nextPost={nextPost} />
    </LangProvider>
  );
}
