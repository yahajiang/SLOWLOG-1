import type { InputHTMLAttributes } from "react"

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-2.5 py-1 text-[13px] border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-zinc-50 focus:bg-white focus:border-[var(--dash-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--dash-accent)]/20 transition-colors placeholder:text-[var(--dash-muted)] disabled:opacity-50 ${className}`}
      {...props}
    />
  )
}