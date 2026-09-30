"use client"

import { getDict, type Dict } from "@/lib/i18n"

// 根级错误边界：`app/error.tsx` 只接得住根 layout **以内**的错误；
// layout 本体（字体、元数据、Provider）或文档结构崩了就没有兜底，直接白屏。
// Next 要求 global-error 自己渲染 <html>/<body>，且它在所有 Provider **之外** ——
// 所以这里不能用 useLang()（Provider 可能正是崩掉的那一层），按浏览器语言直接取字典。
function pick(): Dict {
  const nav = typeof navigator !== "undefined" ? navigator.language || "" : ""
  return getDict(nav.startsWith("zh") ? "zh" : "en")
}

export default function GlobalError({
  error,
  reset,
}: {
  error: &Error
  reset: () => void
}) {
  const t = pick()
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, background: "#fefdfa", color: "#1c1c1e", fontFamily: '"Plus Jakarta Sans", "Segoe UI", "PingFang SC", system-ui, sans-serif' }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 24, textAlign: "center" }}>
          <span style={{ width: 56, height: 56, borderRadius: "50%", background: "#fdf6f5", border: "1px solid #ecc9c6", color: "#c44444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>!</span>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{t.errorTitle}</h1>
          <p style={{ fontSize: 14, color: "#6e6e73", margin: 0, maxWidth: "34em", lineHeight: 1.7 }}>
            {error?.message || t.dashErrorPage}
          </p>
          <button
            onClick={reset}
            style={{ minHeight: 48, padding: "0 20px", fontSize: 14, fontWeight: 500, color: "#fefdfa", background: "#1c1c1e", border: "none", cursor: "pointer" }}
          >
            {t.errorRetry}
          </button>
        </div>
      </body>
    </html>
  )
}
