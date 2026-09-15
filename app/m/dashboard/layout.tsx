import type { Metadata } from "next";
import { auth, passwordChangeRequired } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MDashNav } from "@/components/mobile/MDashNav";
import { MDashTopbar } from "@/components/mobile/MDashTopbar";
import { MDashMain } from "@/components/mobile/MDashMain";

export const metadata: Metadata = {
  title: "后台 · 慢日志",
  robots: { index: false, follow: false },
};

/** 移动后台壳：鉴权守卫 + 顶栏 + 底部 Tab（桌面 dashboard/layout 模式复刻） */
export default async function MobileDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/m/login");
  // 默认密码：强制去**移动版**改密页（N-7）——不再把手机用户踢进桌面壳
  if (passwordChangeRequired(session)) redirect("/m/change-password");
  const userName = (session.user as any)?.name || (session.user as any)?.email || "";
  return (
    <div data-m="1" className="min-h-screen bg-[var(--dash-bg)] flex flex-col">
      <MDashTopbar userName={userName} />
      <MDashMain>{children}</MDashMain>
      <MDashNav />
    </div>
  );
}
