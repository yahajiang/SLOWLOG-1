import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { sessionIsAdmin } from "@/lib/app-auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/Sidebar"

export const metadata: Metadata = {
  title: "仪表盘 · 慢日志",
  robots: { index: false, follow: false },
}

// 强制改密由 middleware 负责（需排除 /dashboard/change-password，layout 内无法按路径区分，避免死循环）
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  // 只读账号（App 自助注册的 reader）没有任何后台页面可看（2026-09-25）。
  // 与强制改密不同，这条不需要按路径放行 ⇒ 放 layout 一处即可；
  // 数据侧另有 requireAdminAuth 兜底，绕过页面直接调 API 也一样被拒。
  if (!sessionIsAdmin(session)) redirect("/")
  return (
    <div className="min-h-screen bg-[var(--dash-bg)] flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col relative z-[2] bg-[var(--dash-bg)]">
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
