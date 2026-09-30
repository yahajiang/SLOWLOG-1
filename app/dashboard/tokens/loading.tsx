import { DashLoading } from "@/components/dashboard/DashLoading"
import { TokensPageSkeleton } from "@/components/dashboard/Skeleton"

// tokens 页此前是桌面后台里唯一没有 loading 的列表页（其余 7 页都有）。
// ⚠️ 只在「永 notFound 的列表段」加边界 —— 详见 components/LoadingShell.tsx 头注的
// 作用域纪律：详情页（/posts/[id]、后台编辑器）会 notFound()，包上 loading 会把
// 真 404 冲成 soft-404，所以那些段刻意不加。
export default function Loading() {
  return (
    <DashLoading>
      <TokensPageSkeleton />
    </DashLoading>
  )
}
