import type { Metadata } from "next";
import { Suspense } from "react";
import { MLogin } from "@/components/mobile/MLogin";
import { getSiteUrlSync } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "登录 · 慢日志",
  description: "慢日志后台登录",
  alternates: { canonical: `${getSiteUrlSync()}/login` },
  robots: { index: false, follow: false },
};

export default function MobileLoginPage() {
  return (
    <Suspense>
      <MLogin />
    </Suspense>
  );
}
