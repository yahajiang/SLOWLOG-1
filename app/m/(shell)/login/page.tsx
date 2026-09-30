import type { Metadata } from "next";
import { Suspense } from "react";
import { MLogin } from "@/components/mobile/MLogin";
import { getSiteUrlSync } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "登录",
  description: "慢日志后台登录",
  alternates: { canonical: `${getSiteUrlSync()}/login` },
  robots: { index: false, follow: false },
};

// 与桌面 /login 同一问题：预渲染 + `<Suspense>` 里用 useSearchParams ⇒ 首屏 HTML 无表单。
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function MobileLoginPage() {
  return (
    <Suspense>
      <MLogin />
    </Suspense>
  );
}
