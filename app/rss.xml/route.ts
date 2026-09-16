import { getPostsPage, FRONT_PAGE_SIZE_MAX } from "@/lib/posts";
import { getSettings } from "@/lib/settings";
import { getSiteUrl } from "@/lib/site-url";
import { cdata, xmlEscape } from "@/lib/xml";

export const dynamic = "force-dynamic"
export const revalidate = 0

/** RSS item 上限：与前台单页上限对齐（多了阅读器也不会看） */
const FEED_LIMIT = FRONT_PAGE_SIZE_MAX

function safePubDate(v: unknown): string {
  const t = v ? new Date(v as string | number | Date).getTime() : NaN
  return Number.isNaN(t) ? new Date().toUTCString() : new Date(t).toUTCString()
}

export async function GET() {
  // origin 只来自 env（防 Host 注入），见 lib/site-url.ts
  const siteUrl = await getSiteUrl();
  const settings = await getSettings();
  const channelTitle = settings.siteName || "慢日志"
  const channelDesc = settings.siteDescription || "慢下来，写点值得读的东西。"
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION
  const generator = appVersion ? `SlowLog v${appVersion}` : "SlowLog"

  let posts: any[] = []
  try {
    // getPostsPage 已按 publishedAt desc 排序（feed 顺序即它），只取最新一页
    const page = await getPostsPage({ page: 1, pageSize: FEED_LIMIT })
    posts = page.items
  } catch { posts = [] }

  const items = posts
    .map((post) => {
      const url = `${siteUrl}/posts/${post.id}`
      const title = post.titleZh || post.title
      const desc = post.excerptZh || post.excerpt || ""
      const cats = [post.category, ...(post.tags || [])]
        .map((c: unknown) => String(c || "").trim())
        .filter(Boolean)
        .slice(0, 10)
      return `
    <item>
      <title><![CDATA[${cdata(title)}]]></title>
      <link>${xmlEscape(url)}</link>
      <guid isPermaLink="true">${xmlEscape(url)}</guid>
      <pubDate>${safePubDate(post.publishedAt || post.createdAt)}</pubDate>
      ${post.author ? `<dc:creator><![CDATA[${cdata(post.author)}]]></dc:creator>` : ""}
      <description><![CDATA[${cdata(desc)}]]></description>
      ${cats.map((c: string) => `<category><![CDATA[${cdata(c)}]]></category>`).join("\n      ")}
    </item>`
    })
    .join("");

  const logo = settings.logoUrl || settings.siteIconUrl
  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xmlEscape(channelTitle)}</title>
    <link>${xmlEscape(siteUrl)}</link>
    <description>${xmlEscape(channelDesc)}</description>
    <language>zh-CN</language>
    <generator>${xmlEscape(generator)}</generator>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>30</ttl>
    <atom:link href="${xmlEscape(siteUrl)}/rss.xml" rel="self" type="application/rss+xml" />
    ${logo ? `<image><url>${xmlEscape(logo)}</url><title>${xmlEscape(channelTitle)}</title><link>${xmlEscape(siteUrl)}</link></image>` : ""}
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
