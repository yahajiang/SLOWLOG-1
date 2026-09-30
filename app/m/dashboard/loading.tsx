import { DashLoading } from "@/components/dashboard/DashLoading"
import { PANEL_CLS } from "@/components/ui/Panel"
import { StatCardSkeleton, ListItemSkeleton, Skeleton } from "@/components/dashboard/Skeleton"

export default function Loading() {
  return (
    <DashLoading compact>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className={PANEL_CLS}>
          {Array.from({ length: 3 }).map((_, i) => <ListItemSkeleton key={i} />)}
        </div>
        <Skeleton className="h-9 w-full" />
      </div>
    </DashLoading>
  )
}
