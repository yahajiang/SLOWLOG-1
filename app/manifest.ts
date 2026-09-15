import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/settings";

// PWA manifest 由站点设置下发（站名/描述随后台「站点设置」变化）
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getSettings();
  return {
    name: s.siteName,
    short_name: s.siteNameEn || s.siteName,
    description: s.siteDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#fefdfa",
    theme_color: "#fefdfa",
    lang: "zh-CN",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
