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
  const { t, lang } = useLang()
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h2 className="text-lg font-semibold text-[var(--dash-text)] mb-2">{t.dashOpFail}</h2>
        <p className="text-sm text-[var(--dash-muted)] mb-4">
          {error.message || t.dashErrorPage}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-[var(--dash-text)] text-[var(--dash-bg)] text-sm rounded-none hover:opacity-90 font-medium"
        >
          {lang === "zh" ? "重试" : "Retry"}
        </button>
      </div>
    </div>
  )
}
