import { notFound } from "next/navigation";
import { getAllPosts, getPostById, getPostBySlug } from "@/lib/posts";
import { PostClient } from "@/components/PostClient";
import { DesktopEscape } from "@/components/DesktopEscape";
import { adaptLegacyPost, pickRelated } from "@/lib/adapt";
import type { Metadata } from "next";

export const revalidate = 60;

// 平板树阅读页：与 /posts/[id] 同构 + 目录抽屉（竖持 <1024）
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const raw = (await getPostBySlug(id)) || (await getPostById(id));
  if (!raw) return { title: "文章未找到" };
  return {
    title: raw.titleZh || raw.title,
    description: raw.excerptZh || raw.excerpt,
    robots: { index: false, follow: true },
  };
}

export default async function TabletPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = (await getPostBySlug(id)) || (await getPostById(id));
  if (!raw) notFound();
  const post = adaptLegacyPost(raw)!;

  const allRaw = await getAllPosts();
  const all = allRaw.map(adaptLegacyPost);
  // 相关文章：同分类∩同标签 > 同分类 > 同标签 > 最新；最多 3 篇
  const relatedPosts = pickRelated(all, post, 3);

  return (
    <>
      <PostClient post={post} rawPost={raw} relatedPosts={relatedPosts} tocDrawer />
      <div className="fixed bottom-3 left-3 z-40">
        <DesktopEscape desktopPath={`/posts/${post.id}`} />
      </div>
    </>
  );
}
