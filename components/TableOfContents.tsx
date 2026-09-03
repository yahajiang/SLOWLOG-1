"use client";

import React, { useEffect, useState } from "react";
import { useLang } from "@/lib/lang-context";

export function TableOfContents({
  headings,
}: {
  headings: { id: string; text: string }[];
}) {
  const [active, setActive] = useState("");
  const isClickRef = React.useRef(false);
  const { t } = useLang();

  useEffect(() => {
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickRef.current) return;
        let best: string | null = null;
        let bestRatio = 0;
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > bestRatio) {
            bestRatio = e.intersectionRatio;
            best = (e.target as HTMLElement).id;
          }
        }
        if (best) setActive(best);
      },
      { rootMargin: "-88px 0px -30% 0px", threshold: [0, 1] }
    );
    els.forEach((el) => observer.observe(el));
    // fallback sync on scroll for crisp active
    function onScroll() {
      if (isClickRef.current) return;
      let cur = "";
      for (const el of els) {
        if (el.getBoundingClientRect().top <= 88) cur = el.id;
      }
      if (cur) setActive(cur);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [headings]);

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
          <nav className="space-y-0.5 border-l border-[var(--yh-border)] pl-3">
            {headings.map((h, idx) => (
              <a
                key={h.id || `heading-${idx}`}
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActive(h.id);
                  isClickRef.current = true;
                  const el = document.getElementById(h.id);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                    history.pushState(null, "", `#${h.id}`);
                  }
                  setTimeout(() => { isClickRef.current = false; }, 800);
                }}
                className={`group flex items-center gap-2 text-[13px] leading-snug transition-all duration-200 border-l-2 -ml-[13px] pl-3 py-[5px] ${
                  active === h.id
                    ? "text-[var(--yh-accent)] border-[var(--yh-accent)] font-medium bg-[var(--yh-accent)]/[0.06] rounded-none"
                    : "text-[var(--yh-muted)] border-transparent hover:text-[var(--yh-text)] hover:border-zinc-300 hover:bg-[var(--yh-bg)]/60 rounded-none"
                }`}
              >
                <span className={`w-1 h-1 rounded-full shrink-0 ${active === h.id ? "bg-[var(--yh-accent)]" : "bg-zinc-300 group-hover:bg-zinc-400"}`} />
                <span className="line-clamp-2">{h.text}</span>
              </a>
            ))}
          </nav>
          <div className="mt-[26px] rounded-none border border-[var(--yh-border)] bg-[var(--dash-card)] p-[13px]">
            <p className="mono text-[12px] font-semibold">{t.readingProgress}</p>
            <div className="h-[7px] rounded-none bg-zinc-100 mt-[9px] overflow-hidden"><div data-side-progress className="h-full w-[0%] rounded-none bg-[var(--yh-accent)] transition-[width] duration-150" /></div>
            <p data-side-progress-text className="mono text-[12px] text-[var(--yh-muted)] mt-[5px]">0% · {t.estimatedTime(10)}</p>
          </div>
          <div className="mt-[18px] pt-[13px] border-t border-[var(--yh-border)] mono text-[12px] text-[var(--yh-muted)]">
            <span className="inline-flex items-center gap-1.5"><span className="w-1 h-1 rounded-none bg-emerald-500 animate-pulse" /> {t.readingNow}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
