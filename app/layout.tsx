import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, JetBrains_Mono, Noto_Serif_SC, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";
import { Welcome } from "@/components/Welcome";
import { SearchPanel } from "@/components/SearchPanel";
import { TabletGate } from "@/components/TabletGate";
import { getSiteUrlSync } from "@/lib/site-url";
import { getSettings } from "@/lib/settings";
import { SettingsProvider } from "@/lib/settings-context";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
  preload: true,
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
  preload: true,
});

const notoSerifSC = Noto_Serif_SC({
  weight: ["400", "600"],
  variable: "--font-serif-sc",
  display: "swap",
  preload: false,
});

// 设置驱动（后端补全）：站点名/描述/关键词/图标由 Setting 表下发（lib/settings.ts），
// 此前全部硬编码——后台改设置对前台零影响。DB 不可达时 getSettings 回退默认值。
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const keywords = s.siteKeywords
    .split(/[,，]/)
    .map((k) => k.trim())
    .filter(Boolean);
  return {
    // 单域名不变式：OG/绝对地址一律走 env 域（与访客域一致），见 lib/site-url.ts
    metadataBase: new URL(getSiteUrlSync()),
    icons: s.siteIconUrl
      ? [{ url: s.siteIconUrl }]
      : {
          icon: [
            { url: "/favicon.svg", type: "image/svg+xml" },
            { url: "/favicon.ico", sizes: "any" },
            { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
          ],
          apple: "/icon-192.png",
        },
    title: {
      default: s.siteName,
      // ⚠️ 模板是唯一实现：各页 title 一律写**裸名**（「归档」不是「归档 · 慢日志」）。
      // 页面里再硬编码一次站点名会拼出「慢日志 | 慢日志」这种重复品牌 —— 上一版有 8 处如此。
      // default 不吃 template，所以首页/无 title 的页仍然只有站点名。
      template: `%s | ${s.siteName}`,
    },
    description: s.siteDescription,
    ...(keywords.length ? { keywords } : {}),
    authors: [{ name: "Yahajiang" }],
    // RSS 自动发现声明放在下面 <head> 里，不在 metadata 里：
    // ① 这版 Metadata 没有 links 键；② 文章页各自设了 alternates.canonical
    // （app/posts/[id]/page.tsx:33），metadata 是浅合并，写在这里会被它们整体覆盖。
    openGraph: {
      title: s.siteName,
      description: s.siteDescription,
      type: "website",
      url: getSiteUrlSync(),
      siteName: s.siteName,
      // 站点级分享卡：文章页有各自的 opengraph-image（lib/adapt.ts:101 postOgMeta），
      // 但分享首页/归档时此前 og:image 为空、twitter:card 退成 summary，
      // 于是「这是我的博客」这句话在群里显示成一块空白灰卡。
      images: s.logoUrl
        ? [{ url: s.logoUrl, width: 512, height: 512, alt: s.siteName }]
        : [{ url: "/icon-512.png", width: 512, height: 512, alt: s.siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title: s.siteName,
      description: s.siteDescription,
      images: s.logoUrl ? [s.logoUrl] : ["/icon-512.png"],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#fefdfa",
  // iPhone 刘海/Home Indicator：允许内容延伸到安全区边缘，由 CSS env() 补偿
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  return (
    <html lang="zh-CN" data-default-theme={settings.theme} className={`${plusJakarta.variable} ${jetbrainsMono.variable} ${cormorant.variable} ${notoSerifSC.variable}`} suppressHydrationWarning>
      <head>
        {/* 关键样式内联：外链 CSS 被网络链路掐断时（国内访问 CF/Vercel 间歇失败），
            页面仍保持纸底/字色/字体的基本排版，不裸奔。
            ⚠️ 只允许 CSS 变量与 body 级规则——任何元素/通配选择器（如 *{margin:0}）
            都是未分层规则，会覆盖 @layer utilities 里的全部 Tailwind 工具类
            （曾导致 mx-auto/px-6 全线失效、容器贴左的线上回归） */}
        {/* ⚠️ P3-17 安全约束：本文件所有 dangerouslySetInnerHTML 的 __html 必须是
            **硬编码字面量**，禁止拼接用户输入 / 数据库字段 / 环境变量。
            以下四处（内联 CSS、CSS 加载探针、主题首帧、回访标记）均满足该约束，
            故当前无 HTML 注入风险；一旦有人往这些字面量里加入插值，
            就等于凭空开出一个注入点——改动前请先看这条注释。 */}
        <style dangerouslySetInnerHTML={{ __html: `:root{--yh-bg:#fefdfa;--yh-text:#1c1c1e;--yh-muted:#6e6e73;--yh-border:#e5e5e7;--yh-accent:#4a6fb5;--yh-accent:oklch(.55 .15 250);--dash-bg:var(--yh-bg);--dash-card:#fff;--dash-border:var(--yh-border);--dash-text:var(--yh-text);--dash-muted:var(--yh-muted);--dash-accent:var(--yh-accent)}body{background:var(--yh-bg);color:var(--yh-text);font-family:var(--font-sans),-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"PingFang SC","Microsoft YaHei",sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}.welcome{position:fixed;inset:0;z-index:90;background:var(--yh-bg)}.html-returning .welcome{display:none}` }} />
        {/* RSS 自动发现：/rss.xml 一直是 200，但全站没有一处 rel=alternate，
            阅读器/聚合器只能靠猜路径。声明在 <head> 而不是 metadata 里有两个原因：
            ① 这版 Metadata 类型没有 links 键；② 文章页各自设了 alternates.canonical
            （app/posts/[id]/page.tsx:33），metadata 浅合并会把根上的 alternates 整体盖掉。
            这是机器可读声明，不是页面上的可见订阅入口（design-blueprint.md:228
            「前台保持隐形」的口径不变）。 */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${settings.siteName} · RSS`}
          href="/rss.xml"
        />
        {/* 外链 CSS 加载失败时自动重载一次（sessionStorage 防循环）：
            探针读 .css-probe 的自定义属性——它只存在于外链 globals.css 中 */}
        <script
          dangerouslySetInnerHTML={{
            __html: "window.addEventListener('load',function(){setTimeout(function(){try{if(sessionStorage.getItem('sl-css-retry'))return;var p=document.createElement('div');p.className='css-probe';document.body.appendChild(p);var ok=getComputedStyle(p).getPropertyValue('--sl-css-loaded').trim()==='1';document.body.removeChild(p);if(!ok){sessionStorage.setItem('sl-css-retry','1');location.reload();}}catch(e){}},400);});",
          }}
        />
      </head>
      <body className="bg-[var(--yh-bg)] text-[var(--yh-text)] antialiased min-h-screen flex flex-col">
        {/* 主题首帧同步：localStorage sl-theme 显式偏好优先；无偏好时依次取
            data-default-theme（后台「站点设置·主题」经 RSC 注入的白名单枚举，
            非用户输入，不违反 P3-17 字面量约束）→ system。首帧前打 dark class，
            避免暗色用户看到白闪 */}
        <script
          dangerouslySetInnerHTML={{
            __html: "try{var t=localStorage.getItem('sl-theme');var dt=document.documentElement.getAttribute('data-default-theme');var d=t?t==='dark':(dt==='dark'?true:dt==='light'?false:matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');var m=document.querySelector('meta[name=theme-color]');if(m)m.content='#14110d'}}catch(e){}",
          }}
        />
        {/* 首帧前同步检查回访标记：回访者给 html 打 class，CSS 直接隐藏欢迎幕（零闪烁） */}
        <script
          dangerouslySetInnerHTML={{
            __html: "try{if(localStorage.getItem('slowlog-welcomed'))document.documentElement.classList.add('html-returning')}catch(e){}",
          }}
        />
        <noscript>
          <style>{".welcome{display:none!important}"}</style>
        </noscript>
        <Providers>
          <SettingsProvider settings={settings}>
            {/* 欢迎幕放在内容之前：流式渲染时首帧即覆盖页面，避免"先见页面后盖幕" */}
            <Welcome />
            {children}
            <SearchPanel />
            <TabletGate />
          </SettingsProvider>
        </Providers>
      </body>
    </html>
  );
}
