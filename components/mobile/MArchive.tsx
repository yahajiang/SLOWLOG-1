"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { MHeader } from "./MHeader";
import { MFooter } from "./MFooter";
import { mCatLabel } from "@/lib/madapt";

/** 移动端归档：标题 + 搜索 + 年份分组全宽行（默认最近 8 篇，其余折叠） */
const VISIBLE = 8;

export function MArchive({ posts, years }: { posts: any[]; years: [number, any[]][] }) {
  const { t, lang } = useLang();
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState(false);
  const filteredYears = q.trim()
    ? years
        .map(
          ([y, arr]) =>
            [
              y,
              arr.filter(
                (p: any) =>
                  (p.titleZh || p.title).toLowerCase().includes(q.toLowerCase()) ||
                  p.category.toLowerCase().includes(q.toLowerCase())
              ),
            ] as [number, any[]]
        )
        .filter(([, arr]) => arr.length > 0)
    : years;

  // 折叠：跨年份按时间倒序取前 VISIBLE 篇，年份组内相应截断
  const total = filteredYears.reduce((a, [, arr]) => a + arr.length, 0);
  const visibleYears = useMemo(() => {
    if (expanded || q.trim()) return filteredYears;
    let budget = VISIBLE;
    const out: [number, any[]][] = [];
    for (const [y, arr] of filteredYears) {
      if (budget <= 0) break;
      const take = arr.slice(0, budget);
      out.push([y, take]);
      budget -= take.length;
    }
    return out;
  }, [filteredYears, expanded, q]);
  const shownCount = visibleYears.reduce((a, [, arr]) => a + arr.length, 0);
  const hiddenCount = total - shownCount;

  return (
    <div data-m="1" className="min-h-screen bg-[var(--yh-bg)] flex flex-col">
      <MHeader />
      <div className="w-full mx-auto px-4 py-6">
        <h1 className="serif text-[28px] font-semibold tracking-tight">{t.archiveTitle}</h1>
        <p className="mono text-[11px] tracking-wide text-[var(--yh-muted)] mt-2">
          {t.archiveDesc(posts.length, years.length)}
          {q && ` · ${t.filteredCount(filteredYears.reduce((a, [, arr]) => a + arr.length, 0))}`}
        </p>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--yh-muted)]" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-4 py-3 text-base border border-[var(--yh-border)] bg-[var(--dash-card)] focus:border-[var(--yh-accent)] focus:outline-none rounded-none placeholder:text-[var(--yh-muted)]"
          />
        </div>
      </div>
      <div className="w-full mx-auto px-4 pb-12 space-y-5 flex-1">
        {visibleYears.map(([year, arr]) => (
          <div key={year} className="border border-[var(--yh-border)] bg-[var(--dash-card)] p-4 rounded-none">
            <h2 className="mono text-[12px] tracking-[0.14em] uppercase font-semibold mb-3">
              {year} · {t.postsCount2(arr.length)}
            </h2>
            <div className="space-y-1">
              {arr.map((p: any) => {
                const d = new Date(p.publishedAt || p.createdAt);
                const md = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                const title = lang === "zh" ? p.titleZh || p.title : p.title;
                return (
                  <Link
                    key={p.id}
                    href={`/m/posts/${p.id}`}
                    className="flex items-center gap-3 py-2.5 border-b border-[var(--yh-border)]/50 last:border-0 active:bg-[var(--yh-bg)]/60"
                  >
                    <span className="mono text-[11px] text-[var(--yh-muted)] w-11 shrink-0">{md}</span>
                    <span className="text-sm truncate flex-1">{title}</span>
                    <span className="mono text-[10px] px-2 py-0.5 border border-[var(--yh-border)] bg-white shrink-0">
                      {mCatLabel(p.category, t)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {filteredYears.length === 0 && (
          <p className="text-sm text-[var(--yh-muted)] text-center py-12">{t.archiveEmpty}</p>
        )}
        {!q.trim() && hiddenCount > 0 && (
          <div className="flex justify-center">
            <button
              onClick={() => setExpanded(!expanded)}
              className="mono text-[11px] tracking-[0.14em] uppercase px-5 py-3 border border-[var(--yh-border)] bg-[var(--dash-card)] text-[var(--yh-muted)] active:text-[var(--yh-text)] transition-colors rounded-none min-h-[44px] w-full"
            >
              {expanded
                ? (lang === "zh" ? "收起 · 只看最近 8 篇" : "Collapse · latest 8")
                : (lang === "zh" ? `展开全部 · ${hiddenCount} 篇` : `Expand all · ${hiddenCount} posts`)}
            </button>
          </div>
        )}
      </div>
      <MFooter desktopHref="/archive" />
    </div>
  );
}
