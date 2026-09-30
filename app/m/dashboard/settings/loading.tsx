import { DashLoading } from "@/components/dashboard/DashLoading"
import { PANEL_CLS } from "@/components/ui/Panel"
import { Skeleton } from "@/components/dashboard/Skeleton"

// 移动后台·站点设置：与同组其余页面同边界（桌面 settings 已有 loading 壳，这里此前漏了，
// 从底栏切进来会白一下）。SettingsForm 自身还有第二层骨架，两层同语感不冲突。
export default function Loading() {
  return (
    <DashLoading compact>
      <div className={PANEL_CLS}>
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
    </DashLoading>
  )
}
