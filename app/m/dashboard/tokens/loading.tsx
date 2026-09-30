import { DashLoading } from "@/components/dashboard/DashLoading";
import { Skeleton, TokensPageSkeleton } from "@/components/dashboard/Skeleton";

// 复用桌面端那一份 TokensPageSkeleton（同一规则只允许一处实现），移动侧只加 compact 壳与页头两行占位。
export default function Loading() {
  return (
    <DashLoading compact>
      <div className="space-y-4">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-full" />
        <TokensPageSkeleton />
      </div>
    </DashLoading>
  );
}
