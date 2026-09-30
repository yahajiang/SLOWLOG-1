import { DashLoading } from "@/components/dashboard/DashLoading";
import { PANEL_CLS } from "@/components/ui/Panel"
import { ListItemSkeleton, Skeleton } from "@/components/dashboard/Skeleton";

// 取形对齐 app/m/dashboard/categories/page.tsx：标题 + 新建卡（默认收起时只有整宽按钮）+ 分类列表卡。
export default function Loading() {
  return (
    <DashLoading compact>
      <div className="space-y-4">
        <Skeleton className="h-7 w-28" />
        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-4">
          <Skeleton className="h-12 w-full" />
        </div>
        <div className={`${PANEL_CLS} divide-y divide-[var(--dash-border)]`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      </div>
    </DashLoading>
  );
}
