"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { MHeader } from "./MHeader";
import { MFooter } from "./MFooter";
import { mCatLabel } from "@/lib/madapt"
import { EmptyState } from "@/components/EmptyState"

// 归档页 = 查看全部的终点：移动端真时间线（与桌面 ArchiveClient 同套 tl-* 规范）
// 轴线随滚动生长 + 节点视口点亮 + 条目淡入；tl-armed 由 JS 挂载，无 JS 静态可见。
export function MArchive({ posts, years }: { posts: any[]; years: [number, any[]][] }) {
  const { t, lang } = useLang();
  const [q, setQ] = useState("");
  const [armed, setArmed] = useState(false);
  const [grow, setGrow] = useState(0);
  const tlRef = useRef<HTMLDivElement>(null);
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
  const tlKey = filteredYears.map(([y, arr]) => `${y}:${arr.length}`).join("|");

  useEffect(() => {
    const root = tlRef.current;
    if (!root) return;
    setArmed(true);
    const items = root.querySelectorAll(".tl-item");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
    );
    items.forEach((el) => io.observe(el));

    function onScroll() {
      const r = root!.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = Math.min(1, Math.max(0, (vh * 0.72 - r.top) / (r.height || 1)));
      setGrow((prev) => (Math.abs(prev - p) < 0.004 ? prev : p));
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tlKey]);

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
      <div className="w-full mx-auto px-4 pb-12 flex-1">
        <div ref={tlRef} className={`tl relative ml-1 pl-6 ${armed ? "tl-armed" : ""}`}>
          {/* 轴线：底层 rail + accent 生长层 */}
          <span aria-hidden className="absolute left-[4px] top-1 h-[calc(100%-8px)] w-px bg-[var(--yh-border)]" />
          <span aria-hidden className="absolute left-[4px] top-1 h-[calc(100%-8px)] w-px bg-[var(--yh-accent)] origin-top will-change-transform" style={{ transform: `scaleY(${grow})`, transition: "transform 120ms linear" }} />

          {filteredYears.map(([year, arr]) => (
            <section key={year} className="mb-9">
              <div className="tl-item relative flex items-center gap-3 mb-4">
                <span aria-hidden className="tl-dot absolute -left-6 top-1/2 -translate-y-1/2 w-[9px] h-[9px] rounded-full border-2 border-[var(--yh-accent)] bg-[var(--dash-card)]" />
                <h2 className="mono text-[12px] tracking-[0.14em] uppercase font-semibold">
                  {year} · {t.postsCount2(arr.length)}
                </h2>
                <span aria-hidden className="flex-1 h-px bg-[var(--yh-border)]" />
              </div>
              <div>
                {arr.map((p: any, i: number) => {
                  const d = new Date(p.publishedAt || p.createdAt);
                  const md = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                  const title = lang === "zh" ? p.titleZh || p.title : p.title;
                  return (
                    <Link
                      key={p.id}
                      href={`/m/posts/${p.id}`}
                      className="tl-item group relative flex items-center gap-3 py-2.5 pr-1 active:bg-[var(--yh-bg)]/60"
                      style={{ transitionDelay: `${(i % 8) * 55}ms` }}
                    >
                      <span aria-hidden className="tl-dot absolute -left-6 top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full" />
                      <span className="mono text-[11px] text-[var(--yh-muted)] w-11 shrink-0">{md}</span>
                      <span className="text-sm truncate flex-1">{title}</span>
                      <span className="mono text-[10px] px-2 py-0.5 border border-[var(--yh-border)] bg-[var(--dash-card)] shrink-0">
                        {mCatLabel(p.category, t)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
          {filteredYears.length === 0 && (
            <EmptyState
              title={lang === "zh" ? "没有匹配的文章" : "No matching posts"}
              hint={lang === "zh" ? "换个关键词试试" : "Try another keyword"}
            />
          )}
        </div>
      </div>
      <MFooter desktopHref="/archive" />
    </div>
  );
}
