import { notFound } from "next/navigation";
import { getAllPosts, getPostById, getPostBySlug } from "@/lib/posts";
import { PostClient } from "@/components/PostClient";
import { DesktopEscape } from "@/components/DesktopEscape";
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

function toLegacy(post: any) {
  if (!post) return null;
  return {
    id: post.id,
    title: post.title,
    titleZh: post.titleZh || post.title,
    excerpt: post.excerpt || "",
    excerptZh: post.excerptZh || post.excerpt || "",
    category: post.category,
    author: post.author || "Yahajiang",
    authorInitial: post.authorInitial || "Y",
    date: post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 10) : new Date(post.createdAt).toISOString().slice(0, 10),
    displayDate: post.displayDate,
    readTime: post.readTime || "5 min",
    featured: post.featured,
    tags: post.tags,
    html: "",
    htmlZh: "",
    headings: post.headings,
    headingsZh: post.headingsZh,
    createdAt: new Date(post.createdAt).toISOString(),
    content: post.content,
    pageConfig: post.pageConfig,
  } as any;
}

export default async function TabletPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = (await getPostBySlug(id)) || (await getPostById(id));
  if (!raw) notFound();
  const post = toLegacy(raw)!;

  const allRaw = await getAllPosts();
  const all = allRaw.map((p) => toLegacy(p)!);
  // 相关文章：同分类∩同标签 > 同分类 > 同标签 > 最新；最多 3 篇
  const exclude = new Set([post.id]);
  const curTags = new Set((post.tags || []).map((t: string) => String(t).toLowerCase()));
  const scored = all
    .filter((p) => !exclude.has(p.id))
    .map((p: any) => {
      const tags = (p.tags || []).map((t: string) => String(t).toLowerCase());
      const overlap = tags.filter((t: string) => curTags.has(t)).length;
      const sameCat = p.category === post.category ? 1 : 0;
      return { p, score: sameCat * 10 + overlap * 3, createdAt: p.createdAt };
    })
    .sort((a, b) => b.score - a.score || +new Date(b.createdAt) - +new Date(a.createdAt));
  const relatedPosts = scored.slice(0, 3).map((s) => s.p);

  return (
    <>
      <PostClient post={post} rawPost={raw} relatedPosts={relatedPosts} tocDrawer />
      <div className="fixed bottom-3 left-3 z-40">
        <DesktopEscape desktopPath={`/posts/${post.id}`} />
      </div>
    </>
  );
}
