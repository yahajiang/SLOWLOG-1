import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/payload";
import { PostClient } from "@/components/PostClient";
import { LangProvider } from "@/lib/lang-context";
import type { Metadata } from "next";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostBySlug(id);
  if (!post) return { title: "文章未找到" };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
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
  const post = await getPostBySlug(id);
  if (!post) notFound();

  const all = await getAllPosts();
  const currentIdx = all.findIndex((p) => p.id === id);
  const prevPost = currentIdx < all.length - 1 ? all[currentIdx + 1] : null;
  const nextPost = currentIdx > 0 ? all[currentIdx - 1] : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
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
    <LangProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostClient post={post} prevPost={prevPost} nextPost={nextPost} />
    </LangProvider>
  );
}
