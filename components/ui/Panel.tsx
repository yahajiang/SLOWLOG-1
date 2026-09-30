// 后台卡片外壳的唯一实现：纸面 + 边框 + 直角 + 裁切内部。
// 这句类名此前在 11 处逐字重复（Skeleton 四份、移动后台三块加载壳、「更多」三块、文章列表一块），
// 任何一次边框/底色调整都要改 11 个地方。这里用**字符串常量**而不是包组件：
// 包一层会重排 11 处 JSX 树（骨架屏里有嵌套 div，替换风险大于收益），常量既单一实现又零结构改动。
// Tailwind v4 按源文件字面量扫描，字符串在本文件里出现一次即可生成 utility。
export const PANEL_CLS = "bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none overflow-hidden"

// 品牌圆标（S 字墨圈）：Header / PostClient / ArchiveClient / TagClient 四处逐字相同。
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`w-[26px] h-[26px] rounded-full bg-[var(--yh-text)] text-[var(--yh-bg)] flex items-center justify-center serif italic text-[12px] shrink-0${className ? ` ${className}` : ""}`}
      aria-hidden
    >
      S
    </span>
  )
}
