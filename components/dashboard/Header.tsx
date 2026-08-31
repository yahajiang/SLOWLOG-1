"use client"
import { Search } from "lucide-react"
import { useState } from "react"

export function DashboardHeader({ onSearch }: { onSearch?: (v: string) => void }) {
  const [q, setQ] = useState("")
  return (
    <header className="h-16 bg-[var(--yh-bg)]/90 backdrop-blur-xl border-b border-[var(--dash-border)] px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold tracking-tight text-[var(--dash-text)]" style={{ fontFamily: "MiSans, sans-serif" }}>
          ◆ 博客后台
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dash-muted)]" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); onSearch?.(e.target.value) }}
            onKeyDown={(e) => { if (e.key === "k" && (e.metaKey || e.ctrlKey)) e.preventDefault() }}
            placeholder="搜索… (⌘K)"
            className="pl-9 pr-4 py-2 w-64 text-sm border border-[var(--dash-border)] bg-zinc-50 focus:bg-white focus:border-[var(--dash-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--dash-accent)]/20 rounded-[var(--radius-sm)] transition-colors"
          />
        </div>
        <div className="w-8 h-8 rounded-full bg-[var(--dash-accent-soft)] text-[var(--dash-accent)] flex items-center justify-center text-sm font-medium border border-[var(--dash-border)]">A</div>
      </div>
    </header>
  )
}
