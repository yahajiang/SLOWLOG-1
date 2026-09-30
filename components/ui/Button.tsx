import type { ButtonHTMLAttributes } from "react"

const variants = {
  primary: "bg-[var(--dash-text)] text-[var(--dash-bg)] hover:opacity-90 border border-transparent",
  secondary: "bg-[var(--dash-card)] border border-[var(--dash-border)] text-[var(--dash-text)] hover:bg-[var(--dash-bg)]",
  ghost: "bg-transparent border border-transparent text-[var(--dash-muted)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-bg)]",
  danger: "bg-[var(--dash-card)] border border-transparent text-[var(--dash-danger)] hover:text-[var(--dash-danger-strong)] hover:bg-[var(--dash-danger-soft)] hover:border-[var(--dash-danger-border)]",
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
      className={`inline-flex items-center justify-center gap-1.5 font-medium rounded-none transition-[color,background-color,border-color,opacity,scale] duration-[var(--duration-exit)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${
        size === "sm" ? "px-3 py-1 text-xs" : "px-3 py-2 text-[13px]"
      } ${variants[variant]} ${className}`}
      {...props}
    />
  )
}