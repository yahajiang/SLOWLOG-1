"use client"
import { useState, type ReactNode } from "react"
import { ChevronRight } from "lucide-react"

export function Collapsible({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-xs font-medium text-[var(--dash-muted)] hover:text-[var(--dash-text)] transition-colors py-0.5 cursor-pointer"
      >
        <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
        {title}
      </button>
      <div className={`grid transition-[grid-template-rows] duration-200 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="pt-3 pb-1">{children}</div>
        </div>
      </div>
    </div>
  )
}