"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang-context";

type DashData = {
  total: number;
  published: number;
  draft: number;
  archived?: number;
  totalViews: number;
  noteCount?: number;
  catCount?: number;
  mediaCount?: number;
  recent: any[];
  topViews?: any[];
  recentNotes?: any[];
};

function StatCard({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const body = (
    <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 shadow-[var(--shadow-card)] h-full">
      <p className="text-[11px] tracking-widest uppercase text-[var(--dash-muted)] font-medium mb-2">{label}</p>
      <p className="text-2xl font-bold tracking-tight text-[var(--dash-text)] tabular-nums">{value}</p>
    </div>
  );
  if (!href) return body;
  return (
    <Link href={href} className="block hover:shadow-[var(--shadow-float)] transition-shadow h-full">
      {body}
    </Link>
  );
}

export function DashboardHome({ data }: { data: DashData }) {
  const { t, lang } = useLang();
  const {
    total = 0,
    published = 0,
    draft = 0,
    totalViews = 0,
    noteCount = 0,
    catCount = 0,
    mediaCount = 0,
    recent = [],
    topViews = [],
    recentNotes = [],
  } = data || {};
  const statusLabel = (s: string) =>
    s === "published" ? t.dashPublished : s === "draft" ? t.dashDraft : s;
  const titleOf = (p: any) => (lang === "zh" ? p.titleZh || p.title : p.title) || t.dashUntitled;

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-xl font-semibold tracking-tight text-[var(--dash-text)]"
          style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}
        >
          {t.dashOverview}
        </h1>
        <p className="text-sm text-[var(--dash-muted)] mt-1">{t.dashHomeSub}</p>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t.dashTotalPosts} value={total} href="/dashboard/posts" />
        <StatCard label={t.dashPublished} value={published} href="/dashboard/posts" />
        <StatCard label={t.dashDraft} value={draft} href="/dashboard/posts" />
        <StatCard label={t.dashTotalViews} value={totalViews} />
      </div>

      {/* 内容资产 */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label={lang === "zh" ? "随想" : "Thoughts"}
          value={noteCount}
          href="/dashboard/notes"
        />
        <StatCard
          label={lang === "zh" ? "分类" : "Categories"}
          value={catCount}
          href="/dashboard/categories"
        />
        <StatCard
          label={lang === "zh" ? "媒体" : "Media"}
          value={mediaCount}
          href="/dashboard/media"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 最近更新 */}
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
                className="flex items-center justify-between py-3 hover:bg-[var(--dash-bg)] px-2 -mx-2 rounded-none transition-colors gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--dash-text)] line-clamp-1">
                    {titleOf(p)}
                    {p.featured && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 border border-[var(--dash-accent)] text-[var(--dash-accent)] align-middle">
                        {lang === "zh" ? "荐" : "FEAT"}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--dash-muted)] truncate">
                    {(lang === "zh" ? p.category?.nameZh || p.category?.name : p.category?.name) || "-"} · {statusLabel(p.status)}
                  </p>
                </div>
                <span className="text-xs text-[var(--dash-muted)] shrink-0">
                  {new Date(p.updatedAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
            {recent.length === 0 && (
              <p className="text-sm text-[var(--dash-muted)] py-8 text-center">{t.dashNoPosts}</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* 快捷入口 */}
          <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold mb-4 text-[var(--dash-text)]">{t.dashQuickActions}</h2>
            <div className="space-y-2.5">
              <Link
                href="/dashboard/posts/new"
                className="block w-full py-3 bg-[var(--dash-text)] text-[var(--dash-bg)] text-sm text-center rounded-none hover:opacity-90 transition-opacity font-medium"
              >
                {t.dashNewPost}
              </Link>
              <Link
                href="/dashboard/notes"
                className="block w-full py-2.5 bg-[var(--dash-card)] border border-[var(--dash-border)] text-sm text-center rounded-none hover:bg-[var(--dash-bg)] transition-colors"
              >
                {t.dashNewThought}
              </Link>
              <Link
                href="/dashboard/media"
                className="block w-full py-2.5 bg-[var(--dash-card)] border border-[var(--dash-border)] text-sm text-center rounded-none hover:bg-[var(--dash-bg)] transition-colors"
              >
                {lang === "zh" ? "上传图片" : "Upload image"}
              </Link>
              <Link
                href="/dashboard/settings"
                className="block w-full py-2.5 bg-[var(--dash-card)] border border-[var(--dash-border)] text-sm text-center rounded-none hover:bg-[var(--dash-bg)] transition-colors"
              >
                {lang === "zh" ? "站点设置" : "Site settings"}
              </Link>
            </div>
          </div>

          {/* 热读 */}
          <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold mb-3 text-[var(--dash-text)]">
              {lang === "zh" ? "热读" : "Top views"}
            </h2>
            {topViews.length === 0 ? (
              <p className="text-xs text-[var(--dash-muted)]">
                {lang === "zh" ? "暂无浏览数据" : "No views yet"}
              </p>
            ) : (
              <ol className="space-y-2.5">
                {topViews.map((p, i) => (
                  <li key={p.id}>
                    <Link href={`/posts/${p.id}`} className="flex items-start gap-2.5 group">
                      <span className="mono text-[11px] text-[var(--dash-muted)] w-5 shrink-0 tabular-nums pt-0.5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs text-[var(--dash-text)] line-clamp-2 group-hover:text-[var(--dash-accent)] transition-colors">
                          {titleOf(p)}
                        </span>
                        <span className="text-[11px] text-[var(--dash-muted)] tabular-nums">
                          {p.viewCount} {lang === "zh" ? "次" : "views"}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* 随想预览 */}
          <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--dash-text)]">
                {lang === "zh" ? "最近随想" : "Recent thoughts"}
              </h2>
              <Link href="/dashboard/notes" className="text-xs text-[var(--dash-accent)] hover:underline">
                {t.dashViewAll}
              </Link>
            </div>
            {recentNotes.length === 0 ? (
              <p className="text-xs text-[var(--dash-muted)]">{t.noThoughts}</p>
            ) : (
              <div className="space-y-3">
                {recentNotes.map((n) => (
                  <div key={n.id} className="border-l-2 border-[var(--dash-border)] pl-3">
                    <p className="text-xs text-[var(--dash-text)] line-clamp-2 leading-relaxed">
                      {lang === "zh" ? n.contentZh || n.content : n.content}
                    </p>
                    <p className="text-[10px] text-[var(--dash-muted)] mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
