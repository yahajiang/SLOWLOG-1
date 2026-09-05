import { DashLoading } from "@/components/dashboard/DashLoading"
import { ListItemSkeleton, Skeleton } from "@/components/dashboard/Skeleton"

export default function Loading() {
  return (
    <DashLoading compact>
      <div className="space-y-3">
        <Skeleton className="h-6 w-24" />
        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => <ListItemSkeleton key={i} />)}
        </div>
      </div>
    </DashLoading>
  )
}
