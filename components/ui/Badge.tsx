import type { ReactNode } from "react"

const tones = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
} as const

export function Badge({
  tone = "emerald",
  children,
}: {
  tone?: keyof typeof tones
  children: ReactNode
}) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  )
}