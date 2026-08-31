import type { ReactNode } from "react"

export function FormField({
  label,
  hint,
  error,
  required,
  children,
  className = "",
}: {
  label: string
  hint?: string
  error?: string | null
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label className="block h-4 text-[11px] font-medium text-[var(--dash-muted)] leading-4">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <p className="h-3 text-[10px] text-red-500 leading-3">{error}</p>
      ) : hint ? (
        <p className="h-3 text-[10px] text-[var(--dash-muted)]/60 leading-3">{hint}</p>
      ) : null}
    </div>
  )
}