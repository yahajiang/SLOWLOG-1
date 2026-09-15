"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, Settings } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { useSiteSettings } from "@/lib/settings-context";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
}

export function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const { t, lang } = useLang();
  // 站名/Logo 由 Setting 下发（后台「站点设置」可改）；无值回退内置品牌
  const settings = useSiteSettings();
  const siteName = settings.siteName || "慢日志";
  const siteNameEn = settings.siteNameEn || "SLOWLOG";

  useEffect(() => {
    // P2-14：包 rAF + 值变更判断，避免每个 scroll 事件都 setState 触发整页重渲染
    let raf = 0;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const next = window.scrollY > 20;
        setScrolled((prev) => (prev === next ? prev : next));
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 h-[62px] border-b transition-all duration-[180ms] ease-[var(--ease-out)] bg-[var(--yh-bg)]/90 backdrop-blur-xl ${
        scrolled ? "border-[var(--yh-border)] shadow-sm" : "border-[var(--yh-border)]"
      }`}
    >
      <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6 h-full">
        <div className="flex items-center justify-between h-full">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="" className="w-[26px] h-[26px] rounded-full object-cover shrink-0" />
            ) : (
              <span className="w-[26px] h-[26px] rounded-full bg-[var(--yh-text)] text-[var(--yh-bg)] flex items-center justify-center serif italic text-[12px] shrink-0">S</span>
            )}
            <span className="flex items-baseline gap-1 whitespace-nowrap">
              <span className="font-semibold text-[15px] tracking-tight text-[var(--yh-text)] group-hover:opacity-60 transition-opacity">{siteName}</span>
              <span className="mono text-[12px] tracking-[0.14em] uppercase text-[var(--yh-text)]">· {siteNameEn}</span>
            </span>
            <span className="hidden 2xl:inline mono text-[12px] tracking-[0.14em] uppercase text-[var(--yh-muted)] border-l border-[var(--yh-border)] pl-3">
              {t.siteSlogan}
            </span>
          </Link>

          <div className="flex items-center gap-3 2xl:gap-7 shrink-0">
            <nav className="hidden md:flex items-center gap-4 2xl:gap-7 mono text-[12px] tracking-[0.14em] uppercase">
              <Link
                href="/"
                className="whitespace-nowrap py-1.5 text-[var(--yh-text)] font-medium hover:opacity-60 transition-opacity"
              >
                {t.navHome}
              </Link>
              <Link
                href="/archive"
                className="whitespace-nowrap py-1.5 text-[var(--yh-muted)] hover:text-[var(--yh-text)] transition-colors"
              >
                {t.archiveTitle}
              </Link>
              <a
                href="/design/gallery.html"
                target="_blank"
                rel="noopener"
                className="whitespace-nowrap py-1.5 text-[var(--yh-muted)] hover:text-[var(--yh-text)] transition-colors"
                title={lang === "zh" ? "UI 组件画廊（新窗口）" : "UI component gallery (new tab)"}
              >
                {lang === "zh" ? "画廊" : "GALLERY"}
              </a>
            </nav>

            <ThemeToggle />
            <LanguageSwitcher />

            <Link
              href="/dashboard"
              className="w-9 h-9 flex items-center justify-center text-[var(--yh-muted)] hover:text-[var(--yh-text)] hover:bg-[var(--yh-border)]/80 transition-colors rounded-none"
              title={t.navAdmin}
            >
              <Settings className="w-[18px] h-[18px]" />
            </Link>

            {/* 搜索：≥xl 内联输入框；<xl 收成图标（点开全局搜索面板），70% 容器全程装得下 */}
            <div className="relative hidden xl:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--yh-muted)]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="pl-10 pr-[18px] py-2 mono text-[12px] tracking-[0.14em] border border-[var(--yh-border)] bg-[var(--dash-card)] focus:bg-[var(--dash-card)] focus:border-[var(--yh-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--yh-accent)]/20 transition-colors w-56 min-h-[48px] rounded-none"
              />
            </div>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("sl-open-search"))}
              className="xl:hidden w-11 h-11 flex items-center justify-center border border-[var(--yh-border)] bg-[var(--dash-card)] text-[var(--yh-muted)] hover:text-[var(--yh-text)] hover:border-[var(--yh-muted)] transition-colors rounded-none"
              aria-label={lang === "zh" ? "全局搜索" : "Search"}
              title={lang === "zh" ? "全局搜索（/）" : "Search (/)"}
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
