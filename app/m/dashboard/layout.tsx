import type { Metadata } from "next";
import { auth, passwordChangeRequired } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MDashNav } from "@/components/mobile/MDashNav";
import { MDashTopbar } from "@/components/mobile/MDashTopbar";

export const metadata: Metadata = {
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
  // 默认密码：强制去桌面改密页（移动无改密 UI）
  if (passwordChangeRequired(session)) redirect("/dashboard/change-password");
  const userName = (session.user as any)?.name || (session.user as any)?.email || "";
  return (
    <div data-m="1" className="min-h-screen bg-[var(--dash-bg)] flex flex-col">
      <MDashTopbar userName={userName} />
      <main className="flex-1 p-4 pb-8">{children}</main>
      <MDashNav />
    </div>
  );
}
