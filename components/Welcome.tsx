"use client"

import { useEffect, useState } from "react"
import { useLang } from "@/lib/lang-context"

// 首访欢迎幕：编排与主站加载态完全同款（品牌横排 + 骨架卡片三条 + 呼吸点），
// 仅首访播一次——SSR 直出（首帧即覆盖无闪现），约 2.1s 整幕轻揭淡出后写入
// localStorage 永久跳过。回访者由根布局内联脚本在首帧前打 html-returning
// 标记，CSS 直接隐藏（完全无感）。
const KEY = "slowlog-welcomed"
const LEAVE_AT = 1500
const HIDE_AT = 2100

export function Welcome() {
  const { t } = useLang()
  const [phase, setPhase] = useState<"show" | "leave" | "hidden">("show")

  useEffect(() => {
    if (document.documentElement.classList.contains("html-returning")) {
      setPhase("hidden")
      return
    }
    document.body.style.overflow = "hidden"
    const t1 = setTimeout(() => setPhase("leave"), LEAVE_AT)
    const t2 = setTimeout(() => {
      setPhase("hidden")
      document.body.style.overflow = ""
      try {
        localStorage.setItem(KEY, "1")
      } catch {}
    }, HIDE_AT)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      document.body.style.overflow = ""
    }
  }, [])

  if (phase === "hidden") return null
  return (
    <div className={`welcome ${phase === "leave" ? "welcome-leave" : ""}`} aria-hidden>
      <div className="w-full max-w-[min(70%,1600px)] mx-auto flex flex-col items-center gap-9">
        {/* 品牌横排 */}
        <div className="wi-item flex items-center gap-4" style={{ animationDelay: "0ms" }}>
          <span className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center serif italic text-[15px]">S</span>
          <span className="mono text-[15px] tracking-[0.14em] uppercase text-[var(--yh-muted)]">慢日志 · SLOWLOG</span>
        </div>
        {/* 骨架卡片：shimmer 三条 200ms 级联 + 呼吸点 */}
        <div
          className="wi-item w-full max-w-lg bg-[var(--dash-card)] border border-[var(--yh-border)] rounded-none p-9 shadow-[var(--shadow-card)]"
          style={{ animationDelay: "150ms" }}
        >
          <div className="space-y-4">
            <div
              className="h-3 w-full bg-[var(--yh-border)]/60 rounded-none animate-[shimmer_1.5s_var(--ease-out)_infinite]"
              style={{ backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)", backgroundSize: "200% 100%" }}
            />
            <div
              className="h-3 w-3/4 bg-[var(--yh-border)]/40 rounded-none animate-[shimmer_1.5s_var(--ease-out)_infinite] [animation-delay:200ms]"
              style={{ backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)", backgroundSize: "200% 100%" }}
            />
            <div
              className="h-3 w-1/2 bg-[var(--yh-border)]/30 rounded-none animate-[shimmer_1.5s_var(--ease-out)_infinite] [animation-delay:400ms]"
              style={{ backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)", backgroundSize: "200% 100%" }}
            />
          </div>
          <div className="mt-9 flex items-center justify-center gap-3">
            <span className="w-2 h-2 rounded-none bg-[var(--yh-accent)] animate-[pulse_1.2s_var(--ease-out)_infinite]" />
            <p className="mono text-[15px] tracking-[0.14em] uppercase text-[var(--yh-muted)]">{t.loading}</p>
          </div>
        </div>
        {/* 底部格言 */}
        <p className="wi-item mono text-[13px] tracking-wide text-[var(--yh-muted)]/60" style={{ animationDelay: "300ms" }}>
          {t.footerTagline}
        </p>
      </div>
    </div>
  )
}
