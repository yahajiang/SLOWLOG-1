import { DashLoading } from "@/components/dashboard/DashLoading"
import { ChangePasswordPageSkeleton } from "@/components/dashboard/Skeleton"

export default function Loading() {
  return (
    <DashLoading>
      <ChangePasswordPageSkeleton />
    </DashLoading>
  )
}
