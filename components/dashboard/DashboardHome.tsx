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
    <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none px-3 py-3 shadow-[var(--shadow-card)] h-full">
      <p className="text-[10px] tracking-widest uppercase text-[var(--dash-muted)] font-medium mb-1 truncate">{label}</p>
      <p className="text-xl font-bold tracking-tight text-[var(--dash-text)] tabular-nums">{value}</p>
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
  const catOf = (p: any) => (lang === "zh" ? p.category?.nameZh || p.category?.name : p.category?.name) || "";
  const tagsOf = (p: any) =>
    Array.isArray(p.tags) ? p.tags.filter(Boolean).slice(0, 2).join(" · ") : "";

  return (
    <div className="space-y-6 section-in">
      <div>
        <h1
          className="text-xl font-semibold tracking-tight text-[var(--dash-text)]"
          style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}
        >
          {t.dashOverview}
        </h1>
        <p className="text-sm text-[var(--dash-muted)] mt-1">{t.dashHomeSub}</p>
      </div>

      {/* 指标一行：7 项等分 */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
        <StatCard label={t.dashTotalPosts} value={total} href="/dashboard/posts" />
        <StatCard label={t.dashPublished} value={published} href="/dashboard/posts" />
        <StatCard label={t.dashDraft} value={draft} href="/dashboard/posts" />
        <StatCard label={t.dashTotalViews} value={totalViews} />
        <StatCard label={lang === "zh" ? "随想" : "Thoughts"} value={noteCount} href="/dashboard/notes" />
        <StatCard label={lang === "zh" ? "分类" : "Categories"} value={catCount} href="/dashboard/categories" />
        <StatCard label={lang === "zh" ? "媒体" : "Media"} value={mediaCount} href="/dashboard/media" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* 最近更新 */}
        <div className="lg:col-span-2 bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--dash-border)]">
            <h2 className="text-[13px] font-semibold text-[var(--dash-text)] tracking-tight">{t.dashRecentPosts}</h2>
            <Link href="/dashboard/posts" className="text-[11px] text-[var(--dash-accent)] hover:underline">
              {t.dashViewAll}
            </Link>
          </div>
          <div className="divide-y divide-[var(--dash-border)]">
            {recent.map((p) => {
              const meta = [catOf(p), tagsOf(p)].filter(Boolean).join(" · ");
              return (
                <Link
                  key={p.id}
                  href={`/dashboard/posts/${p.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--dash-bg)] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-medium text-[var(--dash-text)] truncate">
                        {titleOf(p)}
                      </p>
                      {p.featured && (
                        <span className="shrink-0 text-[10px] px-1 py-px border border-[var(--dash-accent)] text-[var(--dash-accent)] leading-none">
                          {lang === "zh" ? "荐" : "★"}
                        </span>
                      )}
                      {p.status !== "published" && (
                        <span
                          className={`shrink-0 text-[10px] px-1.5 py-px leading-none border ${
                            p.status === "draft"
                              ? "border-amber-200 text-amber-700 bg-amber-50"
                              : "border-[var(--dash-border)] text-[var(--dash-muted)]"
                          }`}
                        >
                          {statusLabel(p.status)}
                        </span>
                      )}
                    </div>
                    {meta && (
                      <p className="text-[11px] text-[var(--dash-muted)] mt-0.5 truncate">{meta}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-[var(--dash-muted)] shrink-0 tabular-nums font-mono">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </span>
                </Link>
              );
            })}
            {recent.length === 0 && (
              <p className="text-sm text-[var(--dash-muted)] py-10 text-center">{t.dashNoPosts}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {/* 快捷入口：2×2 */}
          <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none shadow-[var(--shadow-card)]">
            <h2 className="text-[13px] font-semibold px-4 py-3 border-b border-[var(--dash-border)] text-[var(--dash-text)] tracking-tight">
              {t.dashQuickActions}
            </h2>
            <div className="p-2.5 grid grid-cols-2 gap-2">
              <Link
                href="/dashboard/posts/new"
                className="py-2 bg-[var(--dash-text)] text-[var(--dash-bg)] text-[11px] text-center rounded-none hover:opacity-90 transition-opacity font-medium focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dash-accent)]"
              >
                {t.dashNewPost}
              </Link>
              <Link
                href="/dashboard/notes"
                className="py-2 bg-[var(--dash-card)] border border-[var(--dash-border)] text-[11px] text-center rounded-none hover:bg-[var(--dash-bg)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dash-accent)]"
              >
                {t.dashNewThought}
              </Link>
              <Link
                href="/dashboard/media"
                className="py-2 bg-[var(--dash-card)] border border-[var(--dash-border)] text-[11px] text-center rounded-none hover:bg-[var(--dash-bg)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dash-accent)]"
              >
                {lang === "zh" ? "上传图片" : "Upload"}
              </Link>
              <Link
                href="/dashboard/settings"
                className="py-2 bg-[var(--dash-card)] border border-[var(--dash-border)] text-[11px] text-center rounded-none hover:bg-[var(--dash-bg)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dash-accent)]"
              >
                {lang === "zh" ? "站点设置" : "Settings"}
              </Link>
            </div>
          </div>

          {/* 侧栏动态：随想 + 热读合卡 */}
          <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--dash-border)]">
              <h2 className="text-[13px] font-semibold text-[var(--dash-text)] tracking-tight">
                {lang === "zh" ? "最近随想" : "Recent thoughts"}
              </h2>
              <Link href="/dashboard/notes" className="text-[11px] text-[var(--dash-accent)] hover:underline">
                {t.dashViewAll}
              </Link>
            </div>
            {recentNotes.length === 0 ? (
              <p className="text-[11px] text-[var(--dash-muted)] px-4 py-3">{t.noThoughts}</p>
            ) : (
              <div className="divide-y divide-[var(--dash-border)]">
                {recentNotes.map((n) => (
                  <div key={n.id} className="px-4 py-2.5">
                    <p className="text-[12px] text-[var(--dash-text)] line-clamp-2 leading-relaxed">
                      {lang === "zh" ? n.contentZh || n.content : n.content}
                    </p>
                    <p className="text-[10px] text-[var(--dash-muted)] mt-1 tabular-nums font-mono">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {topViews.length > 0 && (
              <>
                <div className="px-4 py-2.5 border-t border-[var(--dash-border)] bg-[var(--dash-bg)]">
                  <h3 className="text-[11px] font-semibold text-[var(--dash-muted)] tracking-widest uppercase">
                    {lang === "zh" ? "热读" : "Top views"}
                  </h3>
                </div>
                <ol className="divide-y divide-[var(--dash-border)]">
                  {topViews.map((p, i) => (
                    <li key={p.id}>
                      <Link
                        href={`/posts/${p.id}`}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-[var(--dash-bg)] transition-colors group"
                      >
                        <span className="mono text-[10px] text-[var(--dash-muted)] w-4 shrink-0 tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1 min-w-0 text-[12px] text-[var(--dash-text)] truncate group-hover:text-[var(--dash-accent)] transition-colors">
                          {titleOf(p)}
                        </span>
                        <span className="text-[10px] text-[var(--dash-muted)] tabular-nums shrink-0">
                          {p.viewCount}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
