import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="zh-CN">
      <head>
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/npm/misans@4.0/lib/Normal/MiSans-Regular.min.css"
          as="style"
        />
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/npm/misans@4.0/lib/Normal/MiSans-Medium.min.css"
          as="style"
        />
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/npm/misans@4.0/lib/Normal/MiSans-Semibold.min.css"
          as="style"
        />
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/npm/misans@4.0/lib/Normal/MiSans-Bold.min.css"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/misans@4.0/lib/Normal/MiSans-Regular.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/misans@4.0/lib/Normal/MiSans-Medium.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/misans@4.0/lib/Normal/MiSans-Semibold.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/misans@4.0/lib/Normal/MiSans-Bold.min.css"
        />
      </head>
      <body>
        <div
          aria-hidden
          className="fixed inset-0 pointer-events-none z-[1] opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        />
        <div className="relative z-[2]">{children}</div>
      </body>
    </html>
  );
}
