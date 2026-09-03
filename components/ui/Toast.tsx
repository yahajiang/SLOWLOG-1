"use client"
import { createContext, useContext, useState, useCallback } from "react"

type Toast = { id: number; msg: string; type?: "success" | "error" | "info" }

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
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500)
  }, [])
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto min-w-[240px] max-w-[360px] px-4 py-3 rounded-none shadow-[var(--shadow-pop)] border text-sm backdrop-blur flex items-center gap-2 animate-[slideInRight_0.3s_var(--ease-out)] ${
              t.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : t.type === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-[var(--dash-card)] border-[var(--dash-border)] text-[var(--dash-text)]"
            }`}
          >
            <span className="flex-1">{t.msg}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes slideInRight { from { opacity:0; transform: translateX(16px)} to {opacity:1; transform: translateX(0)} }`}</style>
    </Ctx.Provider>
  )
}
