import type { SelectHTMLAttributes } from "react"

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full px-3 py-2 text-[13px] border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--dash-accent)]/20 transition-colors disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}