import type { Metadata } from "next";
import { Cormorant_Garamond, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";
import { Welcome } from "@/components/Welcome";

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

export const metadata: Metadata = {
  title: {
    default: "慢日志",
    template: "%s | 慢日志",
  },
  description:
    "慢下来，写点值得读的东西。关于设计、代码与思考的个人博客。",
  authors: [{ name: "Yahajiang" }],
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "慢日志",
    description: "慢下来，写点值得读的东西。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${plusJakarta.variable} ${jetbrainsMono.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <head>
        {/* 关键样式内联：外链 CSS 被网络链路掐断时（国内访问 CF/Vercel 间歇失败），
            页面仍保持纸底/字色/字体的基本排版，不裸奔。
            ⚠️ 只允许 CSS 变量与 body 级规则——任何元素/通配选择器（如 *{margin:0}）
            都是未分层规则，会覆盖 @layer utilities 里的全部 Tailwind 工具类
            （曾导致 mx-auto/px-6 全线失效、容器贴左的线上回归） */}
        <style dangerouslySetInnerHTML={{ __html: `:root{--yh-bg:#fefdfa;--yh-text:#1c1c1e;--yh-muted:#8e8e93;--yh-border:#e5e5e7;--yh-accent:oklch(.55 .15 250);--dash-bg:var(--yh-bg);--dash-card:#fff;--dash-border:var(--yh-border);--dash-text:var(--yh-text);--dash-muted:var(--yh-muted);--dash-accent:var(--yh-accent)}body{background:var(--yh-bg);color:var(--yh-text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"PingFang SC","Microsoft YaHei",sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}.welcome{position:fixed;inset:0;z-index:90;background:var(--yh-bg)}.html-returning .welcome{display:none}` }} />
        {/* 外链 CSS 加载失败时自动重载一次（sessionStorage 防循环）：
            探针读 .css-probe 的自定义属性——它只存在于外链 globals.css 中 */}
        <script
          dangerouslySetInnerHTML={{
            __html: "window.addEventListener('load',function(){setTimeout(function(){try{if(sessionStorage.getItem('sl-css-retry'))return;var p=document.createElement('div');p.className='css-probe';document.body.appendChild(p);var ok=getComputedStyle(p).getPropertyValue('--sl-css-loaded').trim()==='1';document.body.removeChild(p);if(!ok){sessionStorage.setItem('sl-css-retry','1');location.reload();}}catch(e){}},400);});",
          }}
        />
      </head>
      <body className="bg-[var(--yh-bg)] text-[var(--yh-text)] antialiased min-h-screen flex flex-col">
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
          {/* 欢迎幕放在内容之前：流式渲染时首帧即覆盖页面，避免"先见页面后盖幕" */}
          <Welcome />
          {children}
        </Providers>
      </body>
    </html>
  );
}
