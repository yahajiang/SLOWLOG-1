"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, MessageSquare, Folder, Image as ImageIcon, Settings, ExternalLink, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

const nav = [
  { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
  { href: "/dashboard/posts", label: "文章", icon: FileText },
  { href: "/dashboard/notes", label: "随想", icon: MessageSquare },
  { href: "/dashboard/categories", label: "分类", icon: Folder },
  { href: "/dashboard/media", label: "媒体库", icon: ImageIcon },
  { href: "/dashboard/settings", label: "设置", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-[240px] shrink-0 bg-[var(--dash-card)] border-r border-[var(--dash-border)] flex flex-col h-screen sticky top-0">
      <div className="px-6 py-6 border-b border-[var(--dash-border)]">
        <Link href="/dashboard" className="text-[16px] font-semibold tracking-tight text-[var(--dash-text)] hover:opacity-60 transition-opacity" style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}>
          慢日志后台
        </Link>
        <p className="text-[11px] tracking-wide text-[var(--dash-muted)] mt-1">深度思考 · 缓慢进化</p>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-none transition-[transform,box-shadow,border-color,background-color] duration-200 border-l-[3px] ${active ? "bg-[var(--dash-accent-soft)] text-[var(--dash-accent)] font-medium border-[var(--dash-accent)]" : "text-[var(--dash-muted)] border-transparent hover:text-[var(--dash-text)] hover:bg-[var(--dash-bg)] hover:border-[var(--dash-border)]/50"}`}
            >
              <Icon className="w-4 h-4" /> {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-[var(--dash-border)] space-y-1">
        <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--dash-muted)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-bg)] rounded-none transition-colors">
          <ExternalLink className="w-4 h-4" /> 前台
        </Link>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--dash-muted)] hover:text-red-600 hover:bg-red-50 rounded-none transition-colors text-left">
          <LogOut className="w-4 h-4" /> 登出
        </button>
      </div>
      <div className="px-6 py-4 border-t border-[var(--dash-border)] text-[11px] tracking-wide text-[var(--dash-muted)] text-center">© 2026 慢日志 · 保持专注</div>
    </aside>
  )
}
