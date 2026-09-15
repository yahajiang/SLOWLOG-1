import { notFound } from "next/navigation";
import { getAllPosts, getPostById, getPostBySlug } from "@/lib/posts";
import { PostClient } from "@/components/PostClient";
import { adaptLegacyPost, pickRelated, postOgMeta, safeJsonLd } from "@/lib/adapt";
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
    // canonical：统一到 /posts/<id>（与 sitemap、JSON-LD url 同形态；slug 是双兼容别名），
    // 作者在 SEO 面板填了自定义 canonicalUrl 则优先。此前桌面阅读页完全没有 canonical
    //（移动端反而有）——id/slug 双流量权重无法归一。
    alternates: { canonical: raw.canonicalUrl || `${siteUrl}/posts/${post.id}` },
    // noIndex（SEO 面板字段）此前全站无消费方，此处接上
    ...(raw.noIndex ? { robots: { index: false, follow: true } } : {}),
    openGraph: postOgMeta(post, siteUrl, site.siteName),
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
  const post = adaptLegacyPost(raw)!;

  const allRaw = await getAllPosts();
  const all = allRaw.map(adaptLegacyPost);
  // 相关文章：同分类∩同标签 > 同分类 > 同标签 > 最新；最多 3 篇
  const relatedPosts = pickRelated(all, post, 3);

  const siteUrl = await getSiteUrl();
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
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <PostClient post={post} rawPost={raw} relatedPosts={relatedPosts} />
    </>
  );
}
