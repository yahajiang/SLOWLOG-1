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
      className={`sticky top-0 z-40 border-b transition-all duration-500 bg-[var(--yh-bg)]/90 backdrop-blur-xl [transition-timing-function:var(--ease-spring)] ${
        scrolled ? "border-[var(--yh-border)] shadow-sm" : "border-zinc-200"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-baseline gap-3 group">
            <span className="font-semibold text-xl tracking-tight text-[var(--yh-text)] group-hover:opacity-60 transition-opacity">
              {t.siteName}
            </span>
            <span className="hidden sm:inline text-[10px] tracking-widest uppercase text-[var(--yh-muted)] border-l border-[var(--yh-border)] pl-3">
              {t.siteSlogan}
            </span>
          </Link>

          <div className="flex items-center gap-5">
            <nav className="hidden md:flex items-center gap-6 text-sm">
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
            </nav>

            <LanguageSwitcher />

            <Link
              href="/dashboard"
              className="w-8 h-8 flex items-center justify-center text-[var(--yh-muted)] hover:text-[var(--yh-text)] hover:bg-zinc-100/80 transition-colors rounded"
              title={t.navAdmin}
            >
              <Settings className="w-4 h-4" />
            </Link>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="pl-9 pr-4 py-2 text-xs border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:outline-none transition-colors w-44 md:w-52"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
