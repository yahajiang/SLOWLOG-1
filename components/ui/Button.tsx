import type { ButtonHTMLAttributes } from "react"

const variants = {
  primary: "bg-[var(--dash-text)] text-white hover:opacity-90 border border-transparent",
  secondary: "bg-white border border-[var(--dash-border)] text-[var(--dash-text)] hover:bg-zinc-50",
  ghost: "bg-transparent border border-transparent text-[var(--dash-muted)] hover:text-[var(--dash-text)] hover:bg-zinc-50",
  danger: "bg-white border border-transparent text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200",
} as const

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
  size?: "sm" | "md"
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 font-medium rounded-[var(--radius-sm)] transition-colors disabled:opacity-50 disabled:pointer-events-none ${
        size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
      } ${variants[variant]} ${className}`}
      {...props}
    />
  )
}