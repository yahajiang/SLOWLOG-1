import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  try {
    const posts = await getAllPosts();
    return [
      { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
      ...posts.map((p) => ({
        url: `${base}/posts/${p.id}`,
        lastModified: new Date(p.publishedAt || p.createdAt),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return [{ url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 }]
  }
}
