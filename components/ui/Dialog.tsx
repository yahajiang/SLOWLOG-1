"use client"
import { useEffect, useRef, useState } from "react"

/**
 * 对话框焦点管理（两个框共用一处实现）：
 * 打开时把焦点移进面板、Tab 在面板内循环、关闭时把焦点还给触发元素。
 * 此前这层只有 Esc 与遮罩点击可退，读屏/键盘用户会被留在面板后面的页面上。
 */
function useDialogFocus<T extends HTMLElement>(open: boolean) {
  const panelRef = useRef<T | null>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
        ) || []
      ).filter(function (el) { return !el.hasAttribute("disabled") })
    ;(focusables()[0] || panelRef.current)?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panelRef.current) return
      const els = focusables()
      if (!els.length) return
      const first = els[0]
      const last = els[els.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      prev?.focus?.()
    }
  }, [open])
  return panelRef
}

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
  // 退场渲染：open 变 false 后先播 200ms 退场（遮罩渐隐 + 面板缩回），再真正卸载
  const [render, setRender] = useState(open)
  useEffect(() => {
    if (open) { setRender(true); return }
    const t = setTimeout(() => setRender(false), 200)
    return () => clearTimeout(t)
  }, [open])
  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false)
    window.addEventListener("keydown", onEsc)
    return () => window.removeEventListener("keydown", onEsc)
  }, [open, onOpenChange])
  // 依赖 render 而非只看 open：面板是延一帧才挂上的（退场动画需要 render 状态），
  // 早于它跑 effect 时 panelRef.current 还是 null ⇒ 焦点进不去（2026-09-30 实测）。
  const panelRef = useDialogFocus<HTMLDivElement>(open && render)
  if (!render) return null
  const closing = !open
  return (
    // role/aria-modal/aria-labelledby：此前这是一层普通 div 覆层，读屏不知道弹了对话框、
    // 也不会把语境报成 dialog。焦点进出面板由 useDialogFocus 管。
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 animate-[maskIn_0.2s_var(--ease-out)] ${closing ? "opacity-0" : "opacity-100"}`} onClick={() => onOpenChange(false)} />
      <div ref={panelRef} tabIndex={-1} className={`relative bg-[var(--dash-card)] rounded-none shadow-[var(--shadow-pop)] border border-[var(--dash-border)] w-full max-w-md p-6 ${closing ? "opacity-0 scale-[0.96] transition-all duration-200" : "animate-[scaleIn_0.2s_var(--ease-out)]"}`}>
        <h3 id="confirm-dialog-title" className="text-base font-semibold tracking-tight text-[var(--dash-text)]" style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}>
          {title}
        </h3>
        {description && <p className="text-sm text-[var(--dash-muted)] mt-2 leading-relaxed">{description}</p>}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => onOpenChange(false)} className="px-4 min-h-[48px] text-sm border border-[var(--dash-border)] rounded-none hover:bg-[var(--dash-bg)] transition-colors bg-[var(--dash-card)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dash-accent)]">
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
            className={`px-4 min-h-[48px] text-sm rounded-none transition-colors font-medium focus-visible:outline-2 focus-visible:outline-offset-[-2px] ${variant === "danger" ? "bg-[var(--dash-danger)] text-white hover:bg-[var(--dash-danger-strong)] border border-[var(--dash-danger)] focus-visible:outline-[var(--dash-danger)]" : "bg-[var(--dash-text)] text-[var(--dash-bg)] hover:opacity-90 border border-[var(--dash-text)] focus-visible:outline-[var(--dash-accent)]"}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style>{`@keyframes scaleIn { from { opacity:0; transform: scale(0.96)} to {opacity:1; transform: scale(1)} }
@keyframes maskIn { from { opacity:0 } to { opacity:1 } }`}</style>
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
  // 退场渲染：与 ConfirmDialog 同规（200ms 遮罩渐隐 + 面板缩回）
  const [render, setRender] = useState(open)
  useEffect(() => {
    if (open) { setRender(true); return }
    const t = setTimeout(() => setRender(false), 200)
    return () => clearTimeout(t)
  }, [open])
  const panelRef = useDialogFocus<HTMLFormElement>(open && render)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const v = String(fd.get("value") || "").trim()
    if (!v) return
    onConfirm(v)
    onOpenChange(false)
  }
  if (!render) return null
  const closing = !open
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="prompt-dialog-title">
      <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 animate-[maskIn_0.2s_var(--ease-out)] ${closing ? "opacity-0" : "opacity-100"}`} onClick={() => onOpenChange(false)} />
      <form ref={panelRef} tabIndex={-1} onSubmit={handleSubmit} className={`relative bg-[var(--dash-card)] rounded-none shadow-[var(--shadow-pop)] border border-[var(--dash-border)] w-full max-w-md p-6 ${closing ? "opacity-0 scale-[0.96] transition-all duration-200" : "animate-[scaleIn_0.2s_var(--ease-out)]"}`}>
        <h3 id="prompt-dialog-title" className="text-base font-semibold tracking-tight mb-4" style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}>
          {title}
        </h3>
        <input name="value" defaultValue={defaultValue} placeholder={placeholder} autoFocus className="w-full px-3 py-2 text-sm border border-[var(--dash-border)] rounded-none focus:outline-none focus:border-[var(--dash-accent)] focus:ring-1 focus:ring-[var(--dash-accent)]/20 bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] transition-colors" />
        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={() => onOpenChange(false)} className="px-4 min-h-[48px] text-sm border border-[var(--dash-border)] rounded-none hover:bg-[var(--dash-bg)] bg-[var(--dash-card)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dash-accent)]">取消</button>
          <button type="submit" className="px-4 min-h-[48px] text-sm bg-[var(--dash-text)] text-[var(--dash-bg)] rounded-none hover:opacity-90 font-medium focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dash-accent)]">确认</button>
        </div>
      </form>
    </div>
  )
}
