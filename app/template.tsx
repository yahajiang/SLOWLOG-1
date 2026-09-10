"use client"

import { usePathname } from "next/navigation"

// 文章页内的 fixed 元素（灯箱、阅读进度条）不受影响。
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  )
}
