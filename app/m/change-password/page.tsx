import type { Metadata } from "next";
import { MChangePassword } from "@/components/mobile/MChangePassword";
import { getSiteUrlSync } from "@/lib/site-url";

// N-7：移动端首次改密页。刻意放在 /m/change-password 而非 /m/dashboard/change-password ——
// 后者的 layout 带「未改密即重定向」守卫，置于其下会自我重定向成死循环。
// canonical 指回桌面改密页，与 /m 其余页面的权重归一策略一致。
export const metadata: Metadata = {
  title: "修改账户 · 慢日志",
  description: "慢日志后台 · 首次登录需修改默认账户",
  alternates: { canonical: `${getSiteUrlSync()}/dashboard/change-password` },
  robots: { index: false, follow: false },
};

export default function MobileChangePasswordPage() {
  return <MChangePassword />;
}
