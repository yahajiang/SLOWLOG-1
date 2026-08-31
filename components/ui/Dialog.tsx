"use client"
import { useEffect } from "react"

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "确认操作",
  description,
  confirmText = "确认",
  cancelText = "取消",
  variant = "default",
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "danger"
  onConfirm: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false)
    window.addEventListener("keydown", onEsc)
    return () => window.removeEventListener("keydown", onEsc)
  }, [open, onOpenChange])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative bg-[var(--dash-card)] rounded-[var(--radius-lg)] shadow-[var(--shadow-pop)] border border-[var(--dash-border)] w-full max-w-md p-6 animate-[scaleIn_0.2s_var(--ease-out)]">
        <h3 className="text-base font-semibold tracking-tight text-[var(--dash-text)]" style={{ fontFamily: "MiSans, sans-serif" }}>
          {title}
        </h3>
        {description && <p className="text-sm text-[var(--dash-muted)] mt-2 leading-relaxed">{description}</p>}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm border border-[var(--dash-border)] rounded-[var(--radius-sm)] hover:bg-zinc-50 transition-colors bg-white">
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
            className={`px-4 py-2 text-sm rounded-[var(--radius-sm)] transition-colors font-medium ${variant === "danger" ? "bg-red-600 text-white hover:bg-red-700 border border-red-600" : "bg-[var(--dash-text)] text-white hover:opacity-90 border border-[var(--dash-text)]"}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style>{`@keyframes scaleIn { from { opacity:0; transform: scale(0.96)} to {opacity:1; transform: scale(1)} }`}</style>
    </div>
  )
}

export function PromptDialog({
  open,
  onOpenChange,
  title,
  placeholder,
  defaultValue = "",
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  placeholder?: string
  defaultValue?: string
  onConfirm: (value: string) => void
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const v = String(fd.get("value") || "").trim()
    if (!v) return
    onConfirm(v)
    onOpenChange(false)
  }
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <form onSubmit={handleSubmit} className="relative bg-[var(--dash-card)] rounded-[var(--radius-lg)] shadow-[var(--shadow-pop)] border border-[var(--dash-border)] w-full max-w-md p-6">
        <h3 className="text-base font-semibold tracking-tight mb-4" style={{ fontFamily: "MiSans, sans-serif" }}>
          {title}
        </h3>
        <input name="value" defaultValue={defaultValue} placeholder={placeholder} autoFocus className="w-full px-3 py-2 text-sm border border-[var(--dash-border)] rounded-[var(--radius-sm)] focus:outline-none focus:border-[var(--dash-accent)] focus:ring-1 focus:ring-[var(--dash-accent)]/20 bg-zinc-50 focus:bg-white transition-colors" />
        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-sm border border-[var(--dash-border)] rounded-[var(--radius-sm)] hover:bg-zinc-50 bg-white">取消</button>
          <button type="submit" className="px-4 py-2 text-sm bg-[var(--dash-text)] text-white rounded-[var(--radius-sm)] hover:opacity-90 font-medium">确认</button>
        </div>
      </form>
    </div>
  )
}
