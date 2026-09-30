"use client"
import { createContext, useContext, useState, useCallback } from "react"

type Toast = { id: number; msg: string; type?: "success" | "error" | "info"; leaving?: boolean }

const Ctx = createContext<{ toast: (msg: string, type?: Toast["type"]) => void } | null>(null)

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useToast outside ToastProvider")
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const toast = useCallback((msg: string, type: Toast["type"] = "info") => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, msg, type }])
    // 退场两段式：2500ms 先标记 leaving 播滑出，300ms 后真正卸载
    setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x))), 2500)
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2830)
  }, [])
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto min-w-[min(240px,calc(100vw-2rem))] max-w-[min(360px,calc(100vw-2rem))] px-4 py-3 rounded-none shadow-[var(--shadow-pop)] border text-sm backdrop-blur flex items-center gap-2 ${
              t.type === "success" ? "bg-[var(--dash-ok-soft)] border-[var(--dash-ok-border)] text-[var(--dash-ok)]" : t.type === "error" ? "bg-[var(--dash-danger-soft)] border-[var(--dash-danger-border)] text-[var(--dash-danger-strong)]" : "bg-[var(--dash-card)] border-[var(--dash-border)] text-[var(--dash-text)]"
            }`}
            style={{
              // 用 style 而非动态 animate-[]，确保 Tailwind 扫描不到模板串时动效仍生效
              animation: t.leaving
                ? "slideOutRight 0.28s var(--ease-out) forwards"
                : "slideInRight 0.28s var(--ease-out) both",
            }}
          >
            <span className="flex-1">{t.msg}</span>
          </div>
        ))}
      </div>

    </Ctx.Provider>
  )
}
