"use client";

import { useState, useEffect } from "react";
import { useLang } from "@/lib/lang-context";

export function Footer() {
  const { t } = useLang();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <footer className="mt-auto w-full border-t border-[var(--yh-border)] bg-[var(--dash-card)]">
      {/* 单层页脚：左 = 品牌格言位，右 = 版权与技术位；窄屏自动堆叠 */}
      <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6 py-[11px] flex flex-col lg:flex-row items-center justify-between gap-[9px]">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="w-[22px] h-[22px] rounded-full bg-zinc-900 text-white flex items-center justify-center serif italic text-[11px]">S</span>
          <span className="font-medium">慢日志 · SLOWLOG</span>
          <span className="mono text-[11px] px-1.5 py-0.5 rounded-none bg-[var(--dash-card)] border border-[var(--yh-border)] text-[var(--yh-muted)]">v{process.env.NEXT_PUBLIC_APP_VERSION || "0.2.0"}</span>
          <span className="hidden sm:inline mono text-[var(--yh-muted)]">— {t.siteSlogan}</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-[7px] mono text-[11px] text-[var(--yh-muted)]">
          <span>© {new Date().getFullYear()} Yahajiang</span>
          <span>·</span>
          <a href="mailto:yahajiang@gmail.com" className="hover:text-[var(--yh-text)] transition-colors">yahajiang@gmail.com</a>
          <span>·</span>
          <a href="https://github.com/yahajiang" target="_blank" className="hover:text-[var(--yh-text)] transition-colors">GitHub</a>
          <span className="hidden md:inline">·</span>
          <span className="hidden md:inline">{t.footerBuilt}</span>
        </div>
      </div>
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 w-11 h-11 rounded-none bg-[var(--yh-text)] text-white flex items-center justify-center shadow-lg hover:bg-[var(--yh-accent)] transition-all duration-300 z-50 animate-[fadeIn_0.3s_var(--ease-out)]"
          aria-label="Back to top"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 12V4M4 7l4-4 4 4" />
          </svg>
        </button>
      )}
    </footer>
  );
}
