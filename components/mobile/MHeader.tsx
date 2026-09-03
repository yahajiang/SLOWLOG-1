"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Settings, X } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface MHeaderProps {
  searchQuery?: string;
  onSearchChange?: (v: string) => void;
  showAdmin?: boolean;
}

/** 移动端顶栏：S 圆标 + 慢日志·SLOWLOG + EN 切换 + 可展开搜索（桌面风格同源） */
export function MHeader({ searchQuery = "", onSearchChange, showAdmin = false }: MHeaderProps) {
  const [open, setOpen] = useState(false);
  const { t } = useLang();
  const searchable = typeof onSearchChange === "function";

  return (
    <header className="sticky top-0 z-40 bg-[var(--yh-bg)]/90 backdrop-blur-xl border-b border-[var(--yh-border)]">
      <div className="w-full mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/m" className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center serif italic text-[11px] shrink-0">S</span>
          <span className="flex items-baseline gap-1 min-w-0">
            <span className="font-semibold text-[14px] tracking-tight text-[var(--yh-text)] truncate">慢日志</span>
            <span className="mono text-[11px] tracking-[0.14em] uppercase text-[var(--yh-text)] shrink-0">· SLOWLOG</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher />
          {showAdmin && (
            <Link
              href="/m/dashboard"
              aria-label={t.navAdmin}
              className="w-10 h-10 flex items-center justify-center text-[var(--yh-muted)] hover:text-[var(--yh-text)] active:bg-zinc-100/80 transition-colors rounded-none"
            >
              <Settings className="w-5 h-5" />
            </Link>
          )}
          {searchable && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="w-10 h-10 flex items-center justify-center text-[var(--yh-muted)] hover:text-[var(--yh-text)] active:bg-zinc-100/80 transition-colors rounded-none"
              aria-label="Search"
            >
              {open ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
      {searchable && open && (
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--yh-muted)]" />
            <input
              type="search"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange!(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-3 text-base border border-[var(--yh-border)] bg-[var(--dash-card)] focus:border-[var(--yh-accent)] focus:outline-none rounded-none placeholder:text-[var(--yh-muted)]"
            />
          </div>
        </div>
      )}
    </header>
  );
}
