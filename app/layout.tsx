import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: {
    default: "慢日志",
    template: "%s | 慢日志",
  },
  description:
    "慢下来，写点值得读的东西。关于设计、代码与思考的个人博客。",
  authors: [{ name: "Yahajiang" }],
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
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 字体优化：预加载关键字体 */}
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/misans@4.0/lib/Normal/MiSans-Regular.min.css" as="style" crossOrigin="anonymous" />
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/misans@4.0/lib/Normal/MiSans-Semibold.min.css" as="style" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/misans@4.0/lib/Normal/MiSans-Regular.min.css" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/misans@4.0/lib/Normal/MiSans-Semibold.min.css" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/misans@4.0/lib/Normal/MiSans-Medium.min.css" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/misans@4.0/lib/Normal/MiSans-Bold.min.css" crossOrigin="anonymous" />
      </head>
      <body className="bg-[var(--yh-bg)] text-[var(--yh-text)] antialiased">
        <ToastProvider>
          <div className="relative z-[2]">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}