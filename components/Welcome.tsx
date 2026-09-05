"use client"

import { useEffect, useState } from "react"
import { useLang } from "@/lib/lang-context"

// 首访欢迎幕：「盖章仪式」编排——
//   S 圆标如印章盖落（ease-spring 回弹）→ 强调色下划线自左划出 →
//   品牌字与格言逐字「墨迹晕开」（blur → clear）→ 整幕轻揭淡出。
// 仅首访播一次：SSR 直出首帧即覆盖，回访者由内联脚本首帧前打
// html-returning 标记，CSS 直接隐藏（完全无感）。
const KEY = "slowlog-welcomed"
const LEAVE_AT = 1750
const HIDE_AT = 2300

const BRAND = "慢日志 · SLOWLOG"

/** 逐字墨迹晕开：每个字符 blur(4px) → clear，按 step 依次落下 */
function InkText({
  text,
  delay = 0,
  step = 55,
  className = "",
}: {
  text: string
  delay?: number
  step?: number
  className?: string
}) {
  return (
    <span className={`ink-line ${className}`} aria-label={text}>
      {[...text].map((ch, i) => (
        <span key={i} aria-hidden className="ink-ch" style={{ animationDelay: `${delay + i * step}ms` }}>
          {ch}
        </span>
      ))}
    </span>
  )
}

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
      {/* 纸纹颗粒：独立低强度层（直接铺 background 会满强度染灰） */}
      <div className="welcome-grain" />
      <div className="welcome-inner">
        <div className="wi-stamp">
          <span className="welcome-s">S</span>
          <span className="welcome-line" />
        </div>
        <InkText text={BRAND} delay={600} step={55} className="welcome-brand" />
        <InkText text={t.footerTagline} delay={1050} step={30} className="welcome-tagline" />
      </div>
    </div>
  )
}
