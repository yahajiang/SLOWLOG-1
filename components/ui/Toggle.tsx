"use client"
import type { InputHTMLAttributes } from "react"

export function Toggle({
  label,
  hint,
  checked,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
}) {
  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer select-none ${className}`}>
      <div className={`relative inline-flex h-[18px] w-[32px] shrink-0 items-center rounded-none transition-colors ${checked ? "bg-[var(--dash-accent)]" : "bg-zinc-200"}`}>
        <span className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-none bg-[var(--dash-card)] shadow-sm transition-transform ${checked ? "translate-x-[15px]" : "translate-x-[1px]"}`} />
      </div>
      <input type="checkbox" className="sr-only" checked={checked} {...props} />
      {label && <span className="text-xs font-medium text-[var(--dash-text)]">{label}</span>}
      {hint && <span className="text-[10px] text-[var(--dash-muted)]/60">{hint}</span>}
    </label>
  )
}