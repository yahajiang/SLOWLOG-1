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
    <footer className="mt-16 bg-gradient-to-b from-transparent to-[var(--yh-bg)]">
      <div className="mx-auto max-w-3xl px-6 pt-10 pb-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--yh-border)] to-transparent mb-8" />
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-xs text-[var(--yh-muted)] tracking-wide opacity-70">
            {t.footerSlogan}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-[var(--yh-muted)]">
            <span>&copy; {new Date().getFullYear()} Yahajiang</span>
            <span className="opacity-30">·</span>
            <a href="mailto:yahajiang@gmail.com" className="hover:text-[var(--yh-text)] transition-colors opacity-70 hover:opacity-100">
              yahajiang@gmail.com
            </a>
            <span className="opacity-30">·</span>
            <a href="https://github.com/yahajiang" target="_blank" className="hover:text-[var(--yh-text)] transition-colors opacity-70 hover:opacity-100">
              GitHub
            </a>
            <span className="opacity-30">·</span>
            <a href="https://slowlog.vercel.app" target="_blank" className="hover:text-[var(--yh-text)] transition-colors opacity-70 hover:opacity-100">
              SlowLog
            </a>
          </div>
        </div>
        {showTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-[var(--yh-text)] text-white flex items-center justify-center shadow-lg hover:bg-[var(--yh-accent)] transition-all duration-300 z-50 animate-[fadeIn_0.3s_var(--ease-out)]"
            aria-label="Back to top"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 12V4M4 7l4-4 4 4" />
            </svg>
          </button>
        )}
      </div>
    </footer>
  );
}
