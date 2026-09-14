import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "慢日志",
    short_name: "慢日志",
    description: "慢下来，写点值得读的东西。关于设计、代码与思考的个人博客。",
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
