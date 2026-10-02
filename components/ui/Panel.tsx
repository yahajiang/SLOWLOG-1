// 后台卡片外壳的唯一实现：纸面 + 边框 + 直角 + 裁切内部。
// 用常量而非包组件——包一层要重排各处 JSX 树；Tailwind v4 按字面量扫描，常量出现一次即生成 utility。
export const PANEL_CLS = "bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none overflow-hidden"

// 品牌圆标（S 字墨圈）：Header、标签页与 SiteBrand 共用的图形。
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
