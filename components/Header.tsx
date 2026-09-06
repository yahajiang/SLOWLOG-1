"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, Settings } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
}

export function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 h-[62px] border-b transition-all duration-500 bg-[var(--yh-bg)]/90 backdrop-blur-xl [transition-timing-function:var(--ease-spring)] ${
        scrolled ? "border-[var(--yh-border)] shadow-sm" : "border-[var(--yh-border)]"
      }`}
    >
      <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6 h-full">
        <div className="flex items-center justify-between h-full">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <span className="w-[26px] h-[26px] rounded-full bg-zinc-900 text-white flex items-center justify-center serif italic text-[12px] shrink-0">S</span>
            <span className="flex items-baseline gap-1 whitespace-nowrap">
              <span className="font-semibold text-[15px] tracking-tight text-[var(--yh-text)] group-hover:opacity-60 transition-opacity">慢日志</span>
              <span className="mono text-[12px] tracking-[0.14em] uppercase text-[var(--yh-text)]">· SLOWLOG</span>
            </span>
            <span className="hidden sm:inline mono text-[12px] tracking-[0.14em] uppercase text-[var(--yh-muted)] border-l border-[var(--yh-border)] pl-3">
              {t.siteSlogan}
            </span>
          </Link>

          <div className="flex items-center gap-7">
            <nav className="hidden md:flex items-center gap-7 mono text-[12px] tracking-[0.14em] uppercase">
              <Link
                href="/"
                className="text-[var(--yh-text)] font-medium hover:opacity-60 transition-opacity"
              >
                {t.navHome}
              </Link>
              <Link
                href="/#posts"
                className="text-[var(--yh-muted)] hover:text-[var(--yh-text)] transition-colors"
              >
                {t.navPosts}
              </Link>
              <Link
                href="/archive"
                className="text-[var(--yh-muted)] hover:text-[var(--yh-text)] transition-colors"
              >
                {t.archiveTitle}
              </Link>
            </nav>

            <LanguageSwitcher />

            <Link
              href="/dashboard"
              className="w-9 h-9 flex items-center justify-center text-[var(--yh-muted)] hover:text-[var(--yh-text)] hover:bg-zinc-100/80 transition-colors rounded-none"
              title={t.navAdmin}
            >
              <Settings className="w-[18px] h-[18px]" />
            </Link>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--yh-muted)]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="pl-10 pr-[18px] py-2 mono text-[12px] tracking-[0.14em] border border-[var(--yh-border)] bg-[var(--dash-card)] focus:bg-[var(--dash-card)] focus:border-[var(--yh-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--yh-accent)]/20 transition-colors w-48 md:w-56 min-h-[48px] rounded-none"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
