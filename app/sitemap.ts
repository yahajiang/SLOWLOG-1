import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const posts = getAllPosts();
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    ...posts.map((p) => ({
      url: `${base}/posts/${p.id}`,
      lastModified: new Date(p.date),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
