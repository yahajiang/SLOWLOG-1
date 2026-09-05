import { DashLoading } from "@/components/dashboard/DashLoading"
import { ListItemSkeleton, Skeleton } from "@/components/dashboard/Skeleton"

export default function Loading() {
  return (
    <DashLoading compact>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => <ListItemSkeleton key={i} />)}
        </div>
      </div>
    </DashLoading>
  )
}
