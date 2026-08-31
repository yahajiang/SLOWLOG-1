import type { SelectHTMLAttributes } from "react"

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full px-2.5 py-1.5 text-sm border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-zinc-50 focus:bg-white focus:border-[var(--dash-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--dash-accent)]/20 transition-colors disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}