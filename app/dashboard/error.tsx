"use client"

import { useEffect } from "react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h2 className="text-lg font-semibold text-[var(--dash-text)] mb-2">出错了</h2>
        <p className="text-sm text-[var(--dash-muted)] mb-4">
          {error.message || "页面加载出错，请稍后重试。"}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-[var(--dash-text)] text-white text-sm rounded-none hover:opacity-90 font-medium"
        >
          重试
        </button>
      </div>
    </div>
  )
}
