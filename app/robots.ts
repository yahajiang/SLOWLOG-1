import type { MetadataRoute } from "next";
import { getSiteUrlSync } from "@/lib/site-url";

/**
 * 爬虫入口声明。此前仓内根本没有 robots：/robots.txt 由托管层兜底成一份
 * 只有 content-signals 注释的通用文本（源站实为 404），既没有 User-agent，
 * 也没有一行 Sitemap 指向已存在的 /sitemap.xml —— 搜索引擎只能靠猜。
 *
 * 三条 disallow 的理由：/dashboard 与 /m/dashboard 已经各自 robots:noindex
 * （app/dashboard/layout.tsx:9、app/m/dashboard/layout.tsx:10），但 noindex 不省
 * 抓取配额；/api 下有 NextAuth 与 bearer 通路，被爬一次就多一次无谓鉴权。
 * 只信 env 域，与 lib/site-url.ts 的单域不变式一致（禁止 Host 派生）。
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrlSync();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/m/dashboard", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
