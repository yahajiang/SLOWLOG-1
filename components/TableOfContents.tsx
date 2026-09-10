"use client";

import React, { useEffect, useState } from "react";
import { useLang } from "@/lib/lang-context";

export function TableOfContents({
  headings,
  readMinutes,
}: {
  headings: { id: string; text: string }[];
  readMinutes?: number;
}) {
  const [active, setActive] = useState("");
  const [progress, setProgress] = useState(0);
  const isClickRef = React.useRef(false);
  const releaseTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t } = useLang();

  // 依赖用 id 串（headings 数组每次渲染都是新引用，直接依赖会导致 effect 反复重建）
  const idsKey = headings.map((h) => h.id).join("|");

  useEffect(() => {
    let cancelled = false;
    let bound = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let tries = 0;
    let els: HTMLElement[] = [];

    // ⚠️ 正文由 dynamic 组件异步渲染——mount 时标题可能尚未存在，
    // 必须轮询等待正文出现再绑定（否则目录高亮永不工作）。
    // ⚠️ 不用 headings.id 做 getElementById——DB 保存的 id 与正文渲染的
    // DOM id 是两套生成逻辑，可能字节级不同。直接抓正文标题按文档顺序对齐。
    function tryBind() {
      if (cancelled || bound) return;
      tries++;
      const scope = document.querySelector("article") || document.querySelector(".prose");
      els = scope
        ? Array.from(scope.querySelectorAll<HTMLElement>("h2[id], h3[id]")).slice(0, headings.length)
        : [];
      if (els.length === 0) {
        if (tries < 40) timer = setTimeout(tryBind, 200);
        return;
      }
      bound = true;
      sync();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
    }

    function sync() {
      timer = null;
      if (isClickRef.current || !bound) return;
      // 按文档顺序对齐：最后一个越过 LINE 的元素索引 → 对齐 headings 项
      let curIdx = 0;
      els.forEach((el, i) => {
        if (el.getBoundingClientRect().top <= 96) curIdx = i;
      });
      curIdx = Math.min(curIdx, headings.length - 1);
      const cur = headings[curIdx]?.id || "";
      setActive((prev) => (prev === cur ? prev : cur));
      // 导轨进度必须跟高亮标题同步：按标题区间插值，不用整页 scrollY
      const p = railProgress(els, curIdx);
      setProgress((prev) => (Math.abs(prev - p) < 0.01 ? prev : p));
    }

    /** TOC 蓝轨：在「当前标题 → 下一标题」的滚动区间内 0→1，再映射到 curIdx/n */
    function railProgress(headingsEls: HTMLElement[], curIdx: number): number {
      const n = headingsEls.length;
      if (n === 0) return 0;
      if (n === 1) return 1;
      const line = window.scrollY + 96;
      if (curIdx >= n - 1) return 1;
      const curTop = headingsEls[curIdx].getBoundingClientRect().top + window.scrollY;
      const nextTop = headingsEls[curIdx + 1].getBoundingClientRect().top + window.scrollY;
      const span = Math.max(1, nextTop - curTop);
      const local = Math.min(1, Math.max(0, (line - curTop) / span));
      return (curIdx + local) / n;
    }

    function onScroll() {
      if (isClickRef.current) {
        if (releaseTimer.current) clearTimeout(releaseTimer.current);
        releaseTimer.current = setTimeout(() => { isClickRef.current = false }, 180);
        return;
      }
      if (timer === null) timer = setTimeout(sync, 16);
    }

    tryBind();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (releaseTimer.current) clearTimeout(releaseTimer.current);
      if (bound) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  if (headings.length === 0) return null;

  return (
    <aside className="hidden lg:block w-[308px] shrink-0 -ml-8">
      <div className="sticky top-[88px] border border-[var(--yh-border)] bg-[var(--dash-card)]/95 backdrop-blur-sm shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-5">
        {/* 标题行 */}
        <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-[var(--yh-border)]/70">
          <p className="mono text-[11px] font-medium tracking-[0.16em] uppercase text-[var(--yh-muted)]">
            {t.onThisPage}
          </p>
          <span className="mono text-[10px] tabular-nums text-[var(--yh-muted)]/70">
            {headings.length}
          </span>
        </div>

        {/* 目录 + 左侧进度导轨 */}
        <nav className="relative pl-4">
          <span aria-hidden className="absolute left-0 top-[6px] bottom-[6px] w-px bg-[var(--yh-border)]" />
          <span
            aria-hidden
            className="absolute left-0 top-[6px] bottom-[6px] w-px bg-[var(--yh-accent)] origin-top will-change-transform"
            style={{ transform: `scaleY(${progress})`, transition: "transform 160ms linear" }}
          />
          <ul className="space-y-0.5" role="list">
            {headings.map((h, idx) => {
              const isActive = active === h.id;
              return (
                <li key={h.id || `heading-${idx}`}>
                  <a
                    href={`#${h.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActive(h.id);
                      setProgress((idx + 1) / Math.max(1, headings.length));
                      isClickRef.current = true;
                      if (releaseTimer.current) clearTimeout(releaseTimer.current);
                      const el = document.getElementById(h.id);
                      if (el) {
                        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
                        history.pushState(null, "", `#${h.id}`);
                      }
                      releaseTimer.current = setTimeout(() => { isClickRef.current = false }, 200);
                    }}
                    aria-current={isActive ? "true" : undefined}
                    className={`group relative flex items-center gap-2.5 rounded-none px-2.5 py-[7px] text-[13px] leading-snug transition-colors duration-200 ${
                      isActive
                        ? "text-[var(--yh-accent)] bg-[var(--yh-accent)]/[0.07] font-medium"
                        : "text-[var(--yh-muted)] hover:text-[var(--yh-text)] hover:bg-[var(--yh-bg)]/70"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`shrink-0 rounded-full transition-all duration-200 ${
                        isActive
                          ? "w-1.5 h-1.5 bg-[var(--yh-accent)]"
                          : "w-1 h-1 bg-[var(--yh-border)] group-hover:bg-[var(--yh-muted)]"
                      }`}
                    />
                    <span className="line-clamp-2">{h.text}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 阅读进度 */}
        <div className="mt-5 pt-4 border-t border-[var(--yh-border)]/70">
          <div className="flex items-baseline justify-between mb-2.5">
            <p className="mono text-[11px] tracking-[0.06em] text-[var(--yh-muted)] font-medium">
              {t.readingProgress}
            </p>
          </div>
          <div className="h-[4px] rounded-none bg-[var(--yh-border)]/80 overflow-hidden">
            {/* 勿用 Tailwind scale-*：v4 走 scale 属性，会与 ReadingProgress 写入的 transform 冲突 */}
            <div
              data-side-progress
              className="h-full w-full origin-left rounded-none bg-[var(--yh-accent)]/90 transition-transform duration-150 will-change-transform"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
          <p
            data-side-progress-text
            className="mono text-[11px] tabular-nums text-[var(--yh-muted)]/85 mt-2"
          >
            0% · {t.estimatedTime(readMinutes ?? 10)}
          </p>
        </div>

        {/* 阅读中 */}
        <div className="mt-3.5 flex items-center gap-2 mono text-[11px] text-[var(--yh-muted)]/80">
          <span className="w-1 h-1 rounded-full bg-[var(--yh-accent)] motion-breath shrink-0" />
          <span className="truncate">{t.readingNow}</span>
        </div>
      </div>
    </aside>
  );
}
