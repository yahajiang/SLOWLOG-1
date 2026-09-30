import type { ReactNode } from "react"

const tones = {
  ok: "bg-[var(--dash-ok-soft)] text-[var(--dash-ok)] border-[var(--dash-ok-border)]",
  warn: "bg-[var(--dash-warn-soft)] text-[var(--dash-warn)] border-[var(--dash-warn-border)]",
  info: "bg-[var(--dash-info-soft)] text-[var(--dash-info)] border-[var(--dash-info-border)]",
} as const

export function Badge({
  tone = "ok",
  children,
}: {
  tone?: keyof typeof tones
  children: ReactNode
}) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-none border font-medium whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  )
}