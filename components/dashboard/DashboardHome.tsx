"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

/**
 * 数字滚动的一次性时长。与 `app/globals.css` 的 `--motion-grow` 同值（480ms）——
 * JS 侧读不到 CSS 变量，所以这是一个**需要成对修改**的数：改这里要同时改那边。
 */
const STAT_COUNT_MS = 480;

/** 同上，与 CSS 的 `--ease-out: cubic-bezier(.22, 1, .36, 1)` 四个数成对修改。 */
const EASE_OUT: readonly [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * CSS `cubic-bezier(x1,y1,x2,y2)` 的等价求值。
 *
 * 为什么要在 JS 里重写一条曲线：数字滚动只能逐帧给值，随手写个
 * `1 - (1-p)^3` 之类的近似，就会和全站 CSS 用的那条曲线**方向像、落定节奏不同** ——
 * 这正是"曲线只有一条"要防的分叉。x 轴用二分反解 t（8 次 ⇒ 误差 < 0.4% 的 p），
 * 对 480ms 的读数足够，且不引依赖。
 */
function easeOut(p: number): number {
  const [x1, y1, x2, y2] = EASE_OUT;
  const axis = (t: number, a: number, b: number) =>
    3 * t * (1 - t) * (1 - t) * a + 3 * t * t * (1 - t) * b + t * t * t;
  let lo = 0;
  let hi = 1;
  let t = p;
  for (let i = 0; i < 8; i++) {
    t = (lo + hi) / 2;
    if (axis(t, x1, x2) < p) lo = t;
    else hi = t;
  }
  return axis(t, y1, y2);
}

/**
 * SSR 阶段 `useLayoutEffect` 会告警（它在服务端什么都不做），
 * 所以只在客户端参与布局阶段；服务端那条路径退回 `useEffect`（不会被调用）。
 *
 * 为什么不用普通 `useEffect`：它在**绘制之后**才跑，首帧会先画出终值、
 * 下一帧才跳到 0 再往上数 —— 数字闪一下比不滚更糟。
 */
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * 概览统计数字：从 0 数到真值，**落定即停**（工作台场景禁无触发的循环动效）。
 *
 * - SSR 出来的 HTML 直接是真值，首屏不缺字；客户端挂载后才补这一次滚动。
 * - 系统「减少动态效果」下什么都不做 —— 显示的就是终值。
 * - 只滚数字；字符串（已格式化的值）原样透出，不猜它的格式。
 * - **滚动只在首次挂载播一次；但值之后变了必须立刻跟上**（0.7.x QA qa-1：
 *   早退如果连真值一起挡掉，`router.refresh()` 之后概览会一直显示过期数字）。
 */
function useCountUp(value: number | string): number | string {
  const [shown, setShown] = useState(value);
  const startedRef = useRef(false);
  useIsoLayoutEffect(() => {
    if (typeof value !== "number") return;
    if (startedRef.current) {
      // 已经播过：不再演动画，但要把数字跟上新数据
      setShown(value);
      return;
    }
    startedRef.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const from = 0;
    const t0 = performance.now();
    let raf = 0;
    setShown(from);
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / STAT_COUNT_MS);
      setShown(Math.round(from + (value - from) * easeOut(p)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return shown;
}

/**
 * 概览统计卡。
 *
 * ⚠️ `dash-glare`（hover 流光）**只给可点的那几张**：仓库约定 hover 反馈 = 可点，
 * 阴影过渡本来就挂在 `<Link>` 上；给不可点的卡片加流光就是假可点暗示（QA qa-2）。
 */
function StatCard({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const shown = useCountUp(value);
  const body = (
    <div className={`${href ? "dash-glare " : ""}bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none px-3 py-3 shadow-[var(--shadow-card)] h-full`}>
      <p className="text-[10px] tracking-widest uppercase text-[var(--dash-muted)] font-medium mb-1 truncate">{label}</p>
      <p className="text-xl font-bold tracking-tight text-[var(--dash-text)] tabular-nums">{shown}</p>
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
      <div className="grid grid-cols-4 md:grid-cols-7 gap-3 stagger">
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
            <Link href="/dashboard/posts" className="inline-flex items-center min-h-[40px] px-1 text-[11px] text-[var(--dash-accent)] hover:underline">
              {t.dashViewAll}
            </Link>
          </div>
          <div className="divide-y divide-[var(--dash-border)] stagger">
            {recent.map((p) => {
              const meta = [catOf(p), tagsOf(p)].filter(Boolean).join(" · ");
              return (
                <Link
                  key={p.id}
                  href={`/dashboard/posts/${p.id}`}
                  className="flex items-center gap-3 min-h-[40px] px-4 py-2 hover:bg-[var(--dash-bg)] transition-colors"
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
                className="min-h-[40px] inline-flex items-center justify-center bg-[var(--dash-text)] text-[var(--dash-bg)] text-[11px] text-center rounded-none hover:opacity-90 transition-opacity font-medium focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dash-accent)]"
              >
                {t.dashNewPost}
              </Link>
              <Link
                href="/dashboard/notes"
                className="min-h-[40px] inline-flex items-center justify-center bg-[var(--dash-card)] border border-[var(--dash-border)] text-[11px] text-center rounded-none hover:bg-[var(--dash-bg)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dash-accent)]"
              >
                {t.dashNewThought}
              </Link>
              <Link
                href="/dashboard/media"
                className="min-h-[40px] inline-flex items-center justify-center bg-[var(--dash-card)] border border-[var(--dash-border)] text-[11px] text-center rounded-none hover:bg-[var(--dash-bg)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dash-accent)]"
              >
                {lang === "zh" ? "上传图片" : "Upload"}
              </Link>
              <Link
                href="/dashboard/settings"
                className="min-h-[40px] inline-flex items-center justify-center bg-[var(--dash-card)] border border-[var(--dash-border)] text-[11px] text-center rounded-none hover:bg-[var(--dash-bg)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dash-accent)]"
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
              <Link href="/dashboard/notes" className="inline-flex items-center min-h-[40px] px-1 text-[11px] text-[var(--dash-accent)] hover:underline">
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
