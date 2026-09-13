"use client"

import React, { useEffect, useState } from "react"
import { useLang } from "@/lib/lang-context"
import { useScrollSpy } from "@/lib/hooks/use-scroll-spy"

export function TableOfContents({
  headings,
  readMinutes,
}: {
  headings: { id: string; text: string }[]
  readMinutes?: number
}) {
  const [expanded, setExpanded] = useState(true)
  const { t } = useLang()
  const { activeId, progress, articleProgress, scrollToHeading } = useScrollSpy(headings)

  // ── 同步进度到侧栏 DOM（ReadingProgress 消费） ──
  useEffect(() => {
    document.documentElement.dataset.tocProgress = String(progress)
    const sideBar = document.querySelector("[data-side-progress]") as HTMLElement | null
    if (sideBar) sideBar.style.transform = `scaleX(${progress})`
    const sideText = document.querySelector("[data-side-progress-text]") as HTMLElement | null
    if (sideText) {
      const pct = Math.round(articleProgress)
      const remainMin = Math.max(1, Math.round((1 - articleProgress / 100) * (readMinutes ?? 10)))
      sideText.textContent =
        pct >= 100
          ? `100% · ${t.almostDone}`
          : `${pct}% · ${t.estimatedTime(remainMin)}`
    }
  }, [progress, articleProgress, readMinutes, t])

  if (headings.length === 0) return null

  return (
    <aside className="hidden lg:block w-[308px] shrink-0 -ml-8">
      <div className="sticky top-[88px] border border-[var(--yh-border)] bg-[var(--dash-card)]/95 backdrop-blur-sm shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-5">
        {/* 标题行 + 折叠开关 */}
        <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-[var(--yh-border)]/70">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mono text-[11px] font-medium tracking-[0.16em] uppercase text-[var(--yh-muted)] hover:text-[var(--yh-text)] transition-colors duration-[180ms] ease-[var(--ease-out)] flex items-center gap-1.5"
          >
            {t.onThisPage}
            <span
              aria-hidden
              className="inline-block transition-transform duration-[250ms] ease-[var(--ease-out)]"
              style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}
            >
              ▾
            </span>
          </button>
          <span className="mono text-[10px] tabular-nums text-[var(--yh-muted)]/70">
            {headings.length}
          </span>
        </div>

        {/* 目录列表 */}
        <div
          className={`overflow-hidden transition-all ease-[var(--ease-out)] ${expanded ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0"}`}
          style={{ transitionDuration: expanded ? "250ms" : "200ms" }}
        >
          <nav className={`relative pl-4 pt-1 ${expanded ? "panel-in" : ""}`}>
            <span aria-hidden className="absolute left-0 top-[6px] bottom-[6px] w-px bg-[var(--yh-border)]" />
            <span
              aria-hidden
              className="absolute left-0 top-[6px] bottom-[6px] w-px bg-[var(--yh-accent)] origin-top will-change-transform"
              style={{ transform: `scaleY(${progress})`, transition: "transform 160ms linear" }}
            />
            <ul className="space-y-0.5" role="list">
              {headings.map((h, idx) => {
                const isActive = activeId === h.id
                return (
                  <li key={h.id || `heading-${idx}`}>
                    <a
                      href={`#${h.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        scrollToHeading(h.id)
                      }}
                      aria-current={isActive ? "true" : undefined}
                      className={`group relative flex items-center gap-2.5 rounded-none px-2.5 py-[7px] text-[13px] leading-snug transition-colors duration-[180ms] ease-[var(--ease-out)] ${
                        isActive
                          ? "text-[var(--yh-accent)] bg-[var(--yh-accent)]/[0.07] font-medium"
                          : "text-[var(--yh-muted)] hover:text-[var(--yh-text)] hover:bg-[var(--yh-bg)]/70"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`shrink-0 rounded-full transition-all duration-[180ms] ease-[var(--ease-out)] ${
                          isActive
                            ? "w-1.5 h-1.5 bg-[var(--yh-accent)]"
                            : "w-1 h-1 bg-[var(--yh-border)] group-hover:bg-[var(--yh-muted)]"
                        }`}
                      />
                      <span className="line-clamp-2">{h.text}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>

        {/* 阅读进度 */}
        <div className="mt-5 pt-4 border-t border-[var(--yh-border)]/70">
          <div className="flex items-baseline justify-between mb-2.5">
            <p className="mono text-[11px] tracking-[0.06em] text-[var(--yh-muted)] font-medium">
              {t.readingProgress}
            </p>
          </div>
          <div className="h-[4px] rounded-none bg-[var(--yh-border)]/80 overflow-hidden">
            <div
              data-side-progress
              className="h-full w-full origin-left rounded-none bg-[var(--yh-accent)]/90 transition-transform duration-150 will-change-transform"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
          <p
            data-side-progress-text
            className="mono text-[11px] tabular-nums text-[var(--yh-muted)]/85 mt-2"
          >
            {Math.round(articleProgress)}% · {t.estimatedTime(readMinutes ?? 10)}
          </p>
        </div>

        {/* 阅读中 */}
        <div className="mt-3.5 flex items-center gap-2 mono text-[11px] text-[var(--yh-muted)]/80">
          <span className="w-1 h-1 rounded-full bg-[var(--yh-accent)] motion-breath shrink-0" />
          <span className="truncate">{t.readingNow}</span>
        </div>
      </div>
    </aside>
  )
}
