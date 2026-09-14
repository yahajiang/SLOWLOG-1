"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useLang } from "@/lib/lang-context";

// 出错边界：断线母题 + 歪印 + 错误摘要；纸纹/装订线与过场页同语言。
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t, lang } = useLang();
  const zh = lang === "zh";
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--yh-bg)] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="paper-grain" aria-hidden />
      <span aria-hidden className="tick tick-tl" />
      <span aria-hidden className="tick tick-tr" />
      <span aria-hidden className="tick tick-bl" />
      <span aria-hidden className="tick tick-br" />

      <div className="relative w-full max-w-lg text-center flex flex-col items-center">
        {/* 断线：一条被菱形断开的分隔线 */}
        <div className="flex items-center gap-3 w-full max-w-sm mb-7" aria-hidden>
          <span className="flex-1 h-px bg-[var(--yh-border)]" />
          <span className="w-[7px] h-[7px] rotate-45 border border-[#C2543A]" style={{ backgroundColor: "rgba(194,84,58,0.18)" }} />
          <span className="flex-1 h-px bg-[var(--yh-border)]" />
        </div>

        <span
          className="w-14 h-14 rounded-full bg-[var(--yh-text)] text-[var(--yh-bg)] flex items-center justify-center serif italic text-[20px] shadow-[0_10px_24px_rgba(0,0,0,0.16)] rotate-[-5deg]"
          aria-hidden
        >
          S
        </span>

        <h1 className="serif text-[30px] font-semibold tracking-tight mt-6">{t.errorTitle}</h1>
        <p className="text-sm text-[var(--yh-muted)] mt-3 leading-relaxed max-w-sm">
          {error.message || (zh ? "发生了未知错误，请稍后重试。" : "An unknown error occurred. Please try again in a moment.")}
        </p>
        {error.digest && (
          <p className="mono text-[10px] tracking-[0.22em] uppercase text-[var(--yh-muted)]/60 mt-3">ERR · {error.digest}</p>
        )}

        <div className="flex items-center gap-3 flex-wrap justify-center mt-8">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-[var(--yh-text)] text-[var(--yh-bg)] text-[12px] tracking-[0.14em] uppercase hover:bg-[var(--yh-accent)] transition-colors min-h-[44px]"
          >
            {t.errorRetry}
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 border border-[var(--yh-border)] bg-[var(--dash-card)] text-[12px] tracking-[0.14em] uppercase text-[var(--yh-muted)] hover:text-[var(--yh-text)] hover:border-[var(--yh-muted)] transition-colors min-h-[44px] flex items-center"
          >
            {t.notFoundBack}
          </Link>
        </div>

        <p className="mono text-[11px] tracking-wide text-[var(--yh-muted)]/55 mt-12">{t.footerTagline}</p>
      </div>
    </div>
  );
}
