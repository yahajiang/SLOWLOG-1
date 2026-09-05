"use client"

import { useEffect, useState } from "react"

// 首访欢迎幕：SSR 直出（首帧即覆盖页面，无闪现），级联浮现 S 标 / 品牌字 / 格言，
// 约 2.1s 后整幕轻揭淡出。回访者由根布局的内联脚本在首帧前打 html-returning 标记，
// CSS 直接隐藏（完全无感）；本组件水合后同步移除并写入 localStorage 永久跳过。
const KEY = "slowlog-welcomed"
const LEAVE_AT = 1500
const HIDE_AT = 2100

export function Welcome() {
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
      <div className="welcome-inner">
        <span className="welcome-s">S</span>
        <span className="welcome-brand">慢日志 · SLOWLOG</span>
        <p className="welcome-tagline">慢下来，写点值得读的东西。</p>
      </div>
    </div>
  )
}
