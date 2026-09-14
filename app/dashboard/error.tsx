"use client"

import { useEffect } from "react"
import { useLang } from "@/lib/lang-context"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useLang()
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center flex flex-col items-center">
        {/* 断线 + 歪印：与主站错误页同语言 */}
        <div className="flex items-center gap-3 w-full max-w-[220px] mb-5" aria-hidden>
          <span className="flex-1 h-px bg-[var(--dash-border)]" />
          <span className="w-[6px] h-[6px] rotate-45 border border-[#C2543A]" style={{ backgroundColor: "rgba(194,84,58,0.18)" }} />
          <span className="flex-1 h-px bg-[var(--dash-border)]" />
        </div>
        <span
          className="w-10 h-10 rounded-full bg-[var(--dash-text)] text-[var(--dash-bg)] flex items-center justify-center serif italic text-[15px] rotate-[-5deg]"
          aria-hidden
        >
          S
        </span>
        <h2 className="text-lg font-semibold text-[var(--dash-text)] mt-4 mb-2">{t.dashOpFail}</h2>
        <p className="text-sm text-[var(--dash-muted)]">
          {error.message || t.dashErrorPage}
        </p>
        {error.digest && (
          <p className="mono text-[10px] tracking-[0.2em] uppercase text-[var(--dash-muted)]/60 mt-2">ERR · {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-5 px-5 py-2 bg-[var(--dash-text)] text-[var(--dash-bg)] text-[12px] tracking-[0.14em] uppercase rounded-none hover:bg-[var(--yh-accent)] transition-colors min-h-[40px]"
        >
          {t.errorRetry}
        </button>
      </div>
    </div>
  )
}
