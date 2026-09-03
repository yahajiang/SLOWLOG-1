import type { Metadata } from "next";
import { Suspense } from "react";
import { MLogin } from "@/components/mobile/MLogin";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export const metadata: Metadata = {
  title: "登录 · 慢日志",
  description: "慢日志后台登录",
  alternates: { canonical: `${siteUrl}/login` },
  robots: { index: false, follow: false },
};

export default function MobileLoginPage() {
  return (
    <Suspense>
      <MLogin />
    </Suspense>
  );
}
