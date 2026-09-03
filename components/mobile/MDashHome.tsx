"use client";

import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-4">
      <p className="text-[11px] tracking-widest uppercase text-[var(--dash-muted)] font-medium mb-1.5">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-[var(--dash-text)] tabular-nums">{value}</p>
    </div>
  );
}

/** 移动端数据概览（client 壳，数据由 page 传入） */
export function MDashHome({ data }: {
  data: {
    total: number;
    published: number;
    draft: number;
    totalViews: number;
    recent: any[];
  };
}) {
  const { toast } = useToast();
  const { total, published, draft, totalViews, recent } = data;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--dash-text)]">仪表盘</h1>
        <p className="text-sm text-[var(--dash-muted)] mt-1">概览你的内容</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="文章总数" value={total} />
        <Stat label="已发布" value={published} />
        <Stat label="草稿" value={draft} />
        <Stat label="总访问量" value={totalViews} />
      </div>
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--dash-text)]">近期文章</h2>
          <Link href="/m/dashboard/posts" className="text-xs text-[var(--dash-accent)] min-h-[44px] flex items-center px-2">
            查看全部
          </Link>
        </div>
        <div className="divide-y divide-[var(--dash-border)]">
          {recent.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => toast("完整编辑请使用桌面版", "success")}
              className="w-full flex items-center justify-between gap-2 py-3 px-1 -mx-1 rounded-none text-left min-h-[56px]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--dash-text)] truncate">{p.titleZh || p.title}</p>
                <p className="text-xs text-[var(--dash-muted)] mt-0.5">
                  {p.category?.nameZh || p.category?.name || "-"} · {p.status}
                </p>
              </div>
              <span className="text-xs text-[var(--dash-muted)] shrink-0">
                {new Date(p.updatedAt).toLocaleDateString()}
              </span>
            </button>
          ))}
          {recent.length === 0 && <p className="text-sm text-[var(--dash-muted)] py-8 text-center">暂无文章</p>}
        </div>
      </div>
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-4">
        <h2 className="text-sm font-semibold mb-3 text-[var(--dash-text)]">快速入口</h2>
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => toast("新建文章请使用桌面版", "success")}
            className="block w-full py-3 bg-[var(--dash-text)] text-white text-sm text-center rounded-none font-medium min-h-[48px]"
          >
            新建文章
          </button>
          <Link
            href="/m/dashboard/notes"
            className="flex items-center justify-center w-full py-3 bg-[var(--dash-card)] border border-[var(--dash-border)] text-sm text-center rounded-none min-h-[48px]"
          >
            新建随想
          </Link>
        </div>
      </div>
    </div>
  );
}
