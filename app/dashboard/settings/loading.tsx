import { DashLoading } from "@/components/dashboard/DashLoading"
import { SettingsPageSkeleton } from "@/components/dashboard/Skeleton"

export default function Loading() {
  return (
    <DashLoading>
      <SettingsPageSkeleton />
    </DashLoading>
  )
}
