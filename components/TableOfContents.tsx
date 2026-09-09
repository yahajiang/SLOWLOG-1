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
      // 按文档顺序对齐：最后一个越过 LINE 的元素索引 → 对应 headings 项
      let curIdx = 0;
      els.forEach((el, i) => {
        if (el.getBoundingClientRect().top <= 96) curIdx = i;
      });
      const cur = headings[Math.min(curIdx, headings.length - 1)]?.id || "";
      setActive((prev) => (prev === cur ? prev : cur));
      // Motion 05 阅读：导轨进度 = 文档滚动比例
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      setProgress((prev) => (Math.abs(prev - p) < 0.005 ? prev : p));
    }

    function onScroll() {
      if (isClickRef.current) {
        // 点击锁定：平滑滚动停止 180ms 后自动释放（长距离滚动不闪跳）
        if (releaseTimer.current) clearTimeout(releaseTimer.current);
        releaseTimer.current = setTimeout(() => { isClickRef.current = false }, 180);
        return;
      }
      // setTimeout 触发（rAF 在部分 headless/后台环境不触发）
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
    <>
      {/* 桌面端：宽栏常驻侧边目录 - 向左放宽 280px 直角 */}
      <aside className="hidden lg:block w-[308px] shrink-0 border border-[var(--yh-border)] bg-[var(--dash-card)] rounded-none shadow-sm p-[26px] -ml-8">
        <div className="sticky top-[88px]">
          <div className="flex items-center justify-between mb-[13px]">
            <p className="mono text-[12px] font-medium tracking-[0.14em] uppercase text-[var(--yh-muted)]/60">
              {t.onThisPage}
            </p>
            <span className="mono text-[11px] px-1.5 py-0.5 rounded-none bg-[var(--dash-card)] border border-[var(--yh-border)] text-[var(--yh-muted)]">{headings.length}</span>
          </div>
          <nav className="relative space-y-0.5 pl-3">
            <span aria-hidden className="absolute left-0 top-0 h-full w-px bg-[var(--yh-border)]" />
            <span aria-hidden className="absolute left-0 top-0 h-full w-px bg-[var(--yh-accent)] origin-top will-change-transform" style={{ transform: `scaleY(${progress})`, transition: "transform 150ms linear" }} />
            {headings.map((h, idx) => (
              <a
                key={h.id || `heading-${idx}`}
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActive(h.id);
                  isClickRef.current = true;
                  if (releaseTimer.current) clearTimeout(releaseTimer.current);
                  const el = document.getElementById(h.id);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                    history.pushState(null, "", `#${h.id}`);
                  }
                  releaseTimer.current = setTimeout(() => { isClickRef.current = false }, 200);
                }}
                className={`group flex items-center gap-2 text-[13px] leading-snug transition-all duration-200 border-l-2 -ml-[13px] pl-3 py-[5px] ${
                  active === h.id
                    ? "text-[var(--yh-accent)] border-[var(--yh-accent)] font-medium bg-[var(--yh-accent)]/[0.06] rounded-none"
                    : "text-[var(--yh-muted)] border-transparent hover:text-[var(--yh-text)] hover:border-[var(--yh-border)] hover:bg-[var(--yh-bg)]/60 rounded-none"
                }`}
              >
                <span className={`w-1 h-1 rounded-full shrink-0 ${active === h.id ? "bg-[var(--yh-accent)]" : "bg-[var(--yh-border)] group-hover:bg-[var(--yh-muted)]"}`} />
                <span className="line-clamp-2">{h.text}</span>
              </a>
            ))}
          </nav>
          <div className="mt-[26px] rounded-none border border-[var(--yh-border)] bg-[var(--dash-card)] p-[13px]">
            <p className="mono text-[12px] font-semibold">{t.readingProgress}</p>
            <div className="h-[7px] rounded-none bg-[var(--yh-border)] mt-[9px] overflow-hidden"><div data-side-progress className="h-full w-[0%] rounded-none bg-[var(--yh-accent)] transition-[width] duration-150" /></div>
            <p data-side-progress-text className="mono text-[12px] text-[var(--yh-muted)] mt-[5px]">0% · {t.estimatedTime(readMinutes ?? 10)}</p>
          </div>
          <div className="mt-[18px] pt-[13px] border-t border-[var(--yh-border)] mono text-[12px] text-[var(--yh-muted)]">
            <span className="inline-flex items-center gap-1.5"><span className="w-1 h-1 rounded-none bg-[var(--yh-accent)] motion-breath" /> {t.readingNow}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
