import { notFound } from "next/navigation";
import { getAllPosts, getPostById, getPostBySlug } from "@/lib/posts";
import { PostClient } from "@/components/PostClient";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.slice(0, 20).map((p) => ({ id: p.id }));
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const raw = (await getPostBySlug(id)) || (await getPostById(id));
  if (!raw) return { title: "文章未找到" };
  const post = toLegacy(raw)!;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  return {
    title: post.titleZh || post.title,
    description: post.excerptZh || post.excerpt,
    openGraph: {
      title: post.titleZh || post.title,
      description: post.excerptZh || post.excerpt,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
      url: `${siteUrl}/posts/${post.id}`,
      siteName: "慢日志",
    },
    other: {
      "article:author": post.author,
      "article:published_time": post.date,
    },
  };
}

export default async function PostPage({
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
  const currentIdx = allRaw.findIndex((p) => p.id === id || (p as any).slug === id);
  const prevPost = currentIdx < all.length - 1 ? all[currentIdx + 1] : null;
  const nextPost = currentIdx > 0 ? all[currentIdx - 1] : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.titleZh || post.title,
    description: post.excerptZh || post.excerpt,
    author: { "@type": "Person", name: post.author },
    datePublished: post.date,
    dateModified: post.date,
    url: `${siteUrl}/posts/${post.id}`,
    keywords: post.tags.join(", "),
    publisher: {
      "@type": "Organization",
      name: "慢日志",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostClient post={post} rawPost={raw} prevPost={prevPost} nextPost={nextPost} />
    </>
  );
}
