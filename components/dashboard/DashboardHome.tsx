"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang-context";

export function DashboardHome({ data }: {
  data: {
    total: number;
    published: number;
    draft: number;
    totalViews: number;
    recent: any[];
  };
}) {
  const { t, lang } = useLang();
  const { total, published, draft, totalViews, recent } = data;
  const statusLabel = (s: string) =>
    s === "published" ? t.dashPublished : s === "draft" ? t.dashDraft : s;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--dash-text)]" style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}>
          {t.dashOverview}
        </h1>
        <p className="text-sm text-[var(--dash-muted)] mt-1">{t.dashHomeSub}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 shadow-[var(--shadow-card)]">
          <p className="text-[11px] tracking-widest uppercase text-[var(--dash-muted)] font-medium mb-2">{t.dashTotalPosts}</p>
          <p className="text-2xl font-bold tracking-tight text-[var(--dash-text)] tabular-nums">{total}</p>
        </div>
        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 shadow-[var(--shadow-card)]">
          <p className="text-[11px] tracking-widest uppercase text-[var(--dash-muted)] font-medium mb-2">{t.dashPublished}</p>
          <p className="text-2xl font-bold tracking-tight text-[var(--dash-text)] tabular-nums">{published}</p>
        </div>
        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 shadow-[var(--shadow-card)]">
          <p className="text-[11px] tracking-widest uppercase text-[var(--dash-muted)] font-medium mb-2">{t.dashDraft}</p>
          <p className="text-2xl font-bold tracking-tight text-[var(--dash-text)] tabular-nums">{draft}</p>
        </div>
        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 shadow-[var(--shadow-card)]">
          <p className="text-[11px] tracking-widest uppercase text-[var(--dash-muted)] font-medium mb-2">{t.dashTotalViews}</p>
          <p className="text-2xl font-bold tracking-tight text-[var(--dash-text)] tabular-nums">{totalViews}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--dash-text)]">{t.dashRecentPosts}</h2>
            <Link href="/dashboard/posts" className="text-xs text-[var(--dash-accent)] hover:underline">
              {t.dashViewAll}
            </Link>
          </div>
          <div className="divide-y divide-[var(--dash-border)]">
            {recent.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/posts/${p.id}`}
                className="flex items-center justify-between py-3 hover:bg-[var(--dash-bg)] px-2 -mx-2 rounded-none transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--dash-text)] line-clamp-1">
                    {lang === "zh" ? p.titleZh || p.title : p.title}
                  </p>
                  <p className="text-xs text-[var(--dash-muted)]">
                    {(lang === "zh" ? p.category?.nameZh || p.category?.name : p.category?.name) || "-"} · {statusLabel(p.status)}
                  </p>
                </div>
                <span className="text-xs text-[var(--dash-muted)]">
                  {new Date(p.updatedAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
            {recent.length === 0 && (
              <p className="text-sm text-[var(--dash-muted)] py-8 text-center">{t.dashNoPosts}</p>
            )}
          </div>
        </div>
        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold mb-4 text-[var(--dash-text)]">{t.dashQuickActions}</h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/posts/new"
              className="block w-full py-3 bg-[var(--dash-text)] text-[var(--dash-bg)] text-sm text-center rounded-none hover:opacity-90 transition-opacity font-medium"
            >
              {t.dashNewPost}
            </Link>
            <Link
              href="/dashboard/notes"
              className="block w-full py-3 bg-[var(--dash-card)] border border-[var(--dash-border)] text-sm text-center rounded-none hover:bg-[var(--dash-bg)] transition-colors"
            >
              {t.dashNewThought}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
