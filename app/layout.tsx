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
