"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"

export type DropdownOption = {
  value: string
  label: string
}

/** 后台筛选下拉：方角 + panel-in/out，替代原生 select（原生弹层无法动画） */
export function DropdownSelect({
  value,
  onChange,
  options,
  className = "",
  triggerClassName = "",
  ariaLabel,
  minWidth = 0,
}: {
  value: string
  onChange: (v: string) => void
  options: DropdownOption[]
  className?: string
  triggerClassName?: string
  ariaLabel?: string
  minWidth?: number
}) {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = options.find((o) => o.value === value) ?? options[0]

  // P2-11：退场定时器需可清理，避免卸载后仍 setState
  const closeTimerRef = useRef<number | null>(null)
  const close = useCallback(() => {
    setClosing(true)
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false)
      setClosing(false)
      closeTimerRef.current = null
    }, 180)
  }, [])
  useEffect(
    () => () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
    },
    []
  )

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    document.addEventListener("mousedown", onDoc)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDoc)
      document.removeEventListener("keydown", onKey)
    }
  }, [open, close])

  return (
    <div ref={rootRef} className={`relative ${className}`} style={minWidth ? { minWidth } : undefined}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? close() : setOpen(true))}
        className={`w-full px-3 py-2 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] text-left flex items-center justify-between gap-2 hover:bg-[var(--dash-bg)] focus:border-[var(--dash-accent)] focus:ring-1 focus:ring-[var(--dash-accent)]/20 focus:outline-none transition-colors ${triggerClassName}`}
      >
        <span className="truncate">{selected?.label ?? ""}</span>
        <svg
          className={`w-3 h-3 shrink-0 text-[var(--dash-muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
        >
          <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
        </svg>
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto border border-[var(--dash-border)] bg-[var(--dash-card)] shadow-[var(--shadow-float,0_8px_24px_rgba(0,0,0,0.08))] ${closing ? "panel-out" : "panel-in"}`}
        >
          {options.map((o) => {
            const active = o.value === value
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(o.value)
                  close()
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-inset-[-1px] focus-visible:outline-[var(--dash-accent)] ${
                  active
                    ? "bg-[var(--dash-accent-soft,rgba(59,130,246,0.12))] text-[var(--dash-accent)] font-medium"
                    : "text-[var(--dash-text)] hover:bg-[var(--dash-bg)]"
                }`}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
