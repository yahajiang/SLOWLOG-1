import { getAllPosts } from "@/lib/posts";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  // origin 只来自 env（防 Host 注入），见 lib/site-url.ts
  const siteUrl = await getSiteUrl();
  let posts: any[] = []
  try { posts = await getAllPosts() } catch { posts = [] }
  const items = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.titleZh || post.title}]]></title>
      <link>${siteUrl}/posts/${post.id}</link>
      <guid>${siteUrl}/posts/${post.id}</guid>
      <pubDate>${new Date(post.publishedAt || post.createdAt).toUTCString()}</pubDate>
      <description><![CDATA[${post.excerptZh || post.excerpt || ""}]]></description>
      <category><![CDATA[${post.category}]]></category>
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>慢日志</title>
    <link>${siteUrl}</link>
    <description>慢下来，写点值得读的东西。</description>
    <language>zh-CN</language>
    <generator>SlowLog v0.3</generator>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
