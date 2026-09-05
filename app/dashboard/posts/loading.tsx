import { DashLoading } from "@/components/dashboard/DashLoading"
import { PostsPageSkeleton } from "@/components/dashboard/Skeleton"

export default function Loading() {
  return (
    <DashLoading>
      <PostsPageSkeleton />
    </DashLoading>
  )
}
