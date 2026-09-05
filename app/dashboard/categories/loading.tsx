import { DashLoading } from "@/components/dashboard/DashLoading"
import { CategoriesPageSkeleton } from "@/components/dashboard/Skeleton"

export default function Loading() {
  return (
    <DashLoading>
      <CategoriesPageSkeleton />
    </DashLoading>
  )
}
