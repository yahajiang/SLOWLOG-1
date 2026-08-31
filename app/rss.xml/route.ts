import { getAllPosts } from "@/lib/posts";

export const dynamic = "force-dynamic"

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
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
<rss version="2.0">
  <channel>
    <title>慢日志</title>
    <link>${siteUrl}</link>
    <description>慢下来，写点值得读的东西。</description>
    <language>zh-CN</language>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
