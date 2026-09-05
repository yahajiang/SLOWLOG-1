import { DashLoading } from "@/components/dashboard/DashLoading"
import { MediaPageSkeleton } from "@/components/dashboard/Skeleton"

export default function Loading() {
  return (
    <DashLoading>
      <MediaPageSkeleton />
    </DashLoading>
  )
}
