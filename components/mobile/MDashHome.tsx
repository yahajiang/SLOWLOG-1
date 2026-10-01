"use client";

import Link from "next/link";
import { AdminTitle } from "@/components/ui/AdminTitle"
import { useToast } from "@/components/ui/Toast";
import { useLang } from "@/lib/lang-context";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none px-2 py-2.5 min-h-[64px] flex flex-col justify-center shadow-[var(--shadow-card)]">
      <p className="text-[9px] tracking-widest uppercase text-[var(--dash-muted)] font-medium mb-0.5 truncate">{label}</p>
      <p className="text-base font-bold tracking-tight text-[var(--dash-text)] tabular-nums">{value}</p>
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
    noteCount?: number;
    catCount?: number;
    mediaCount?: number;
  };
}) {
  const { toast } = useToast();
  const { t, lang } = useLang();
  // P2-10：data 可能为空（上游取数失败/未传入），加兜底避免解构抛错白屏
  const { total, published, draft, totalViews, recent, noteCount = 0, catCount = 0, mediaCount = 0 } = data ?? {};
  return (
    <div className="space-y-5 section-in">
      <div>
        <AdminTitle>{t.dashOverview}</AdminTitle>
        <p className="text-sm text-[var(--dash-muted)] mt-1">{t.dashHomeSub}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label={t.dashTotalPosts} value={total} />
        <Stat label={t.dashPublished} value={published} />
        <Stat label={t.dashDraft} value={draft} />
        <Stat label={t.dashTotalViews} value={totalViews} />
        <Link href="/m/dashboard/notes" className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none px-2 py-2.5 min-h-[64px] flex flex-col justify-center shadow-[var(--shadow-card)] active:opacity-60 transition-opacity">
          <p className="text-[9px] tracking-widest uppercase text-[var(--dash-muted)] mb-0.5 truncate">{lang === "zh" ? "随想" : "Notes"}</p>
          <p className="text-base font-bold tabular-nums text-[var(--dash-text)]">{noteCount}</p>
        </Link>
        <Link href="/m/dashboard/more" className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none px-2 py-2.5 min-h-[64px] flex flex-col justify-center shadow-[var(--shadow-card)] active:opacity-60 transition-opacity">
          <p className="text-[9px] tracking-widest uppercase text-[var(--dash-muted)] mb-0.5 truncate">{lang === "zh" ? "分类" : "Cats"}</p>
          <p className="text-base font-bold tabular-nums text-[var(--dash-text)]">{catCount}</p>
        </Link>
        <Link href="/m/dashboard/more" className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none px-2 py-2.5 min-h-[64px] flex flex-col justify-center shadow-[var(--shadow-card)] active:opacity-60 transition-opacity">
          <p className="text-[9px] tracking-widest uppercase text-[var(--dash-muted)] mb-0.5 truncate">{lang === "zh" ? "媒体" : "Media"}</p>
          <p className="text-base font-bold tabular-nums text-[var(--dash-text)]">{mediaCount}</p>
        </Link>
      </div>
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--dash-text)]">{t.dashRecentPosts}</h2>
          <Link href="/m/dashboard/posts" className="mono text-xs tracking-[0.08em] text-[var(--dash-accent)] min-h-[48px] flex items-center px-2 rounded-none active:opacity-60 active:bg-[var(--dash-accent-soft)] transition-colors">
            {t.dashViewAll}
          </Link>
        </div>
        <div className="divide-y divide-[var(--dash-border)]">
          {recent.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => toast(t.dashEditOnDesktop, "success")}
              className="w-full flex items-center justify-between gap-2 py-3 px-1 -mx-1 rounded-none text-left min-h-[56px] transition-colors active:bg-[var(--dash-bg)]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--dash-text)] truncate">
                  {lang === "zh" ? p.titleZh || p.title : p.title}
                </p>
                <p className="text-xs text-[var(--dash-muted)] mt-0.5">
                  {(lang === "zh" ? p.category?.nameZh || p.category?.name : p.category?.name) || "-"} ·{" "}
                  {p.status === "published" ? t.dashPublished : p.status === "draft" ? t.dashDraft : p.status}
                </p>
              </div>
              <span className="text-xs text-[var(--dash-muted)] shrink-0">
                {new Date(p.updatedAt).toLocaleDateString()}
              </span>
            </button>
          ))}
          {recent.length === 0 && (
            <div className="py-8 text-center"><p className="text-sm font-medium text-[var(--dash-text)]">{t.dashNoPosts}</p></div>
          )}
        </div>
      </div>
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-4 shadow-[var(--shadow-card)]">
        <h2 className="text-sm font-semibold mb-3 text-[var(--dash-text)]">{t.dashQuickActions}</h2>
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => toast(t.dashNewOnDesktop, "success")}
            className="block w-full py-3 bg-[var(--dash-text)] text-[var(--dash-bg)] text-sm text-center rounded-none font-medium min-h-[48px] active:opacity-60 transition-opacity"
          >
            {t.dashNewPost}
          </button>
          <Link
            href="/m/dashboard/notes"
            className="flex items-center justify-center w-full py-3 bg-[var(--dash-card)] border border-[var(--dash-border)] text-[var(--dash-text)] text-sm text-center rounded-none min-h-[48px] active:bg-[var(--dash-bg)] active:opacity-80 transition-colors"
          >
            {t.dashNewThought}
          </Link>
        </div>
      </div>
    </div>
  );
}
