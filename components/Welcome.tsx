"use client"

import { useEffect, useState } from "react"
import { useLang } from "@/lib/lang-context"
import { pickTagline } from "@/lib/taglines"

// 首访欢迎幕：「盖章仪式」编排——
//   品牌字与格言「墨迹晕开」→ 整幕上移轻揭。
const KEY = "slowlog-welcomed"
const LEAVE_AT = 2100
const HIDE_AT = 2700

const BRAND = "慢日志 · SLOWLOG"

/** 逐字墨迹晕开：每个字符 blur(3px) → clear，按 step 依次落下 */
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
  const { t, lang } = useLang()
  const [phase, setPhase] = useState<"show" | "leave" | "hidden">("show")
  const [tagline, setTagline] = useState<string>(t.footerTagline)

  useEffect(() => {
    setTagline(pickTagline(lang))
  }, [lang])

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
      <div className="welcome-grain" />
      <span className="welcome-frame welcome-frame-tl" />
      <span className="welcome-frame welcome-frame-tr" />
      <span className="welcome-frame welcome-frame-bl" />
      <span className="welcome-frame welcome-frame-br" />
      <div className="welcome-vignette" />
      <div className="welcome-inner">
        <div className="wi-stamp">
          <span className="welcome-s">S</span>
          <span className="welcome-line" />
        </div>
        <InkText text={BRAND} delay={720} step={48} className="welcome-brand" />
        <InkText text={tagline} delay={1180} step={28} className="welcome-tagline" />
        <p className="welcome-hint">SLOW</p>
      </div>
    </div>
  )
}
