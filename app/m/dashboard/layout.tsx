import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MDashNav } from "@/components/mobile/MDashNav";

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
  return (
    <div data-m="1" className="min-h-screen bg-[var(--dash-bg)] flex flex-col">
      <div className="sticky top-0 z-40 bg-[var(--dash-card)]/95 backdrop-blur-xl border-b border-[var(--dash-border)]">
        <div className="w-full mx-auto px-4 h-14 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center serif italic text-[11px] shrink-0">S</span>
            <span className="font-semibold text-[14px] tracking-tight text-[var(--dash-text)]">慢日志后台</span>
          </span>
          <span className="mono text-[10px] tracking-[0.14em] uppercase text-[var(--dash-muted)]">
            {(session.user as any)?.name || (session.user as any)?.email || ""}
          </span>
        </div>
      </div>
      <main className="flex-1 p-4 pb-8">{children}</main>
      <MDashNav />
    </div>
  );
}
