import { DashLoading } from "@/components/dashboard/DashLoading"
import { NotesPageSkeleton } from "@/components/dashboard/Skeleton"

export default function Loading() {
  return (
    <DashLoading>
      <NotesPageSkeleton />
    </DashLoading>
  )
}
