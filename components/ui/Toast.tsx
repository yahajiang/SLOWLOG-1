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
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800)
  }, [])
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto min-w-[240px] max-w-[360px] px-4 py-3 rounded-none shadow-[var(--shadow-pop)] border text-sm backdrop-blur flex items-center gap-2 animate-[${t.leaving ? "slideOutRight" : "slideInRight"}_0.28s_var(--ease-out)_forwards] ${
              t.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : t.type === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-[var(--dash-card)] border-[var(--dash-border)] text-[var(--dash-text)]"
            }`}
          >
            <span className="flex-1">{t.msg}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes slideInRight { from { opacity:0; transform: translateX(10px)} to {opacity:1; transform: translateX(0)} }
@keyframes slideOutRight { from { opacity:1; transform: translateX(0)} to {opacity:0; transform: translateX(10px)} }`}</style>
    </Ctx.Provider>
  )
}
