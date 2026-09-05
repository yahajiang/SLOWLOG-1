import { DashLoading } from "@/components/dashboard/DashLoading"
import { DashboardPageSkeleton } from "@/components/dashboard/Skeleton"

export default function Loading() {
  return (
    <DashLoading>
      <DashboardPageSkeleton />
    </DashLoading>
  )
}
