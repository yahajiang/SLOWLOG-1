"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { LayoutDashboard, FileText, MessageSquare, Folder, Image as ImageIcon, Settings, ExternalLink, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { signOut } from "next-auth/react"
import { useLang } from "@/lib/lang-context"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { ThemeToggle } from "@/components/ThemeToggle"

export function Sidebar() {
  const pathname = usePathname()
  const { t, lang } = useLang()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("dash-sidebar-collapsed") === "1")
    } catch {}
  }, [])

  // 窄视口（<1024px，平板竖持/小窗口）自动折叠成图标栏，给内容区让位；
  // 用户手动切换仍以 localStorage 为准（与视口状态叠加：手动展开优先于视口折叠）
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)")
    const apply = () => {
      if (mq.matches) {
        try { localStorage.setItem("dash-sidebar-collapsed-pre-auto", localStorage.getItem("dash-sidebar-collapsed") || "0") } catch {}
        setCollapsed(true)
      } else {
        try { setCollapsed(localStorage.getItem("dash-sidebar-collapsed") === "1") } catch {}
      }
    }
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v
      try {
        localStorage.setItem("dash-sidebar-collapsed", next ? "1" : "0")
      } catch {}
      return next
    })
  }

  const nav = [
    { href: "/dashboard", label: t.dashOverview, icon: LayoutDashboard },
    { href: "/dashboard/posts", label: t.dashPosts, icon: FileText },
    { href: "/dashboard/notes", label: t.dashNotes, icon: MessageSquare },
    { href: "/dashboard/categories", label: t.dashCategories, icon: Folder },
    { href: "/dashboard/media", label: t.dashMedia, icon: ImageIcon },
    { href: "/dashboard/settings", label: t.dashSettings, icon: Settings },
  ]

  // 行内控件通用类：收起时仅图标居中，展开时图标+文字
  const rowBase = "flex items-center rounded-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dash-accent)]"

  return (
    <aside
      className={`${collapsed ? "w-[68px]" : "w-[240px]"} shrink-0 bg-[var(--dash-card)] border-r border-[var(--dash-border)] flex flex-col h-screen sticky top-0 transition-[width] duration-300 ease-[var(--ease-out)] overflow-hidden`}
    >
      {/* 品牌行 + 收起/展开开关 */}
      <div className={`px-3 py-5 border-b border-[var(--dash-border)] flex flex-col ${collapsed ? "items-center gap-3" : "gap-3"}`}>
        <div className={`flex items-center w-full ${collapsed ? "justify-center" : "justify-between px-3"}`}>
          <Link
            href="/dashboard"
            className={collapsed ? "hidden" : "text-[16px] font-semibold tracking-tight text-[var(--dash-text)] hover:opacity-60 transition-opacity whitespace-nowrap overflow-hidden"}
            style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}
          >
            {collapsed ? "S" : t.dashBrand}
          </Link>
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? t.dashExpand : t.dashCollapse}
            aria-expanded={!collapsed}
            title={collapsed ? t.dashExpand : t.dashCollapse}
            className={`${collapsed ? "w-10 h-10" : "w-8 h-8"} flex items-center justify-center text-[var(--dash-muted)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-bg)] rounded-none transition-colors`}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>
        {!collapsed && (
          <p className="px-3 text-[11px] tracking-wide text-[var(--dash-muted)] whitespace-nowrap overflow-hidden transition-opacity duration-200">
            {t.dashTagline}
          </p>
        )}
      </div>

      {/* 导航：展开=图标+文字；收起=图标居中 + title 提示 */}
      <nav className={`flex-1 py-6 space-y-1 ${collapsed ? "px-2" : "px-3"}`}>
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              title={item.label}
              className={`${rowBase} ${collapsed ? "justify-center w-full h-10" : "gap-3 px-3 py-2.5 text-sm border-l-[3px]"} ${active ? "bg-[var(--dash-accent-soft)] text-[var(--dash-accent)] font-medium border-[var(--dash-accent)]" : "text-[var(--dash-muted)] border-transparent hover:text-[var(--dash-text)] hover:bg-[var(--dash-bg)]"} focus-visible:outline-[var(--dash-accent)]`}
            >
              <Icon className="w-4 h-4 shrink-0" /> {!collapsed && <span className="whitespace-nowrap overflow-hidden transition-opacity duration-200">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* 页脚：第一行 前台+登出；第二行 主题+语言 */}
      <div className={`p-3 border-t border-[var(--dash-border)] space-y-2 ${collapsed ? "flex flex-col items-center" : ""}`}>
        <Link
          href="/"
          title={t.dashFront}
          className={`${rowBase} ${collapsed ? "justify-center w-full h-10" : "w-full gap-3 px-3 py-2 text-sm text-[var(--dash-muted)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-bg)]"}`}
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">{t.dashFront}</span>}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={t.dashLogout}
          className={`${rowBase} ${collapsed ? "justify-center w-full h-10" : "w-full gap-3 px-3 py-2 text-sm text-[var(--dash-muted)] hover:text-red-600 hover:bg-red-50"}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">{t.dashLogout}</span>}
        </button>
        <ThemeToggle variant={collapsed ? "icon" : "row"} />
        <LanguageSwitcher variant={collapsed ? "icon" : "row"} ghost />
        {!collapsed && (
          <p className="px-1 pt-1 text-[11px] tracking-wide text-[var(--dash-muted)] whitespace-nowrap overflow-hidden">© {new Date().getFullYear()} {lang === "zh" ? "慢日志" : "SlowLog"} · {t.dashFocus}</p>
        )}
      </div>
    </aside>
  )
}
