import type { ReactNode } from "react"

// 后台页面主标题的唯一实现：11 处逐字重复的同一条类名 + 同一句字体栈内联样式。
// 走 Plus Jakarta Sans 西文界面族；20px 是界面级标题，不是阅读标题，所以刻意不进衬线族。
export function AdminTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h1
      className={`text-xl font-semibold tracking-tight text-[var(--dash-text)]${className ? ` ${className}` : ""}`}
      style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}
    >
      {children}
    </h1>
  )
}
