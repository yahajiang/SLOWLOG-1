"use client"

import { usePathname } from "next/navigation"

// 路由模板：每次导航重新挂载（key = pathname），配合 .page-enter > * 让
// loading 骨架与正片内容先后各自淡入——页面切换从此有连贯的入场节奏。
// pageIn 的 to 帧为 transform:none，动画结束后不残留 containing block，
// 文章页内的 fixed 元素（灯箱、阅读进度条）不受影响。
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  )
}
