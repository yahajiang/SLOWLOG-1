"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/lang-context";
import { List } from "lucide-react";

export function TableOfContents({
  headings,
}: {
  headings: { id: string; text: string }[];
}) {
  const [active, setActive] = useState("");
  const [expanded, setExpanded] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    function onScroll() {
      const els = headings
        .map((h) => document.getElementById(h.id))
        .filter(Boolean) as HTMLElement[];
      let cur = "";
      for (const el of els) {
        if (el.getBoundingClientRect().top <= 120) cur = el.id;
      }
      setActive(cur);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <>
      {/* 桌面端：固定侧边目录 */}
      <aside className="hidden lg:block w-52 shrink-0">
        <div className="sticky top-24">
          <p className="text-[10px] font-medium tracking-widest uppercase text-[var(--yh-muted)]/50 mb-4">
            {t.onThisPage}
          </p>
          <nav className="space-y-1 border-l border-[var(--yh-border)] pl-4">
            {headings.map((h, idx) => (
              <a
                key={h.id || `heading-${idx}`}
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`block text-[13px] leading-snug transition-all duration-300 border-l-2 -ml-[17px] pl-4 py-0.5 ${
                  active === h.id
                    ? "text-[var(--yh-accent)] border-[var(--yh-accent)] translate-x-0.5 font-medium"
                    : "text-[var(--yh-muted)] border-transparent hover:text-[var(--yh-text)] hover:border-zinc-300"
                }`}
              >
                {h.text}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* 移动端：浮动目录按钮 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 bg-[var(--yh-text)] text-white rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        <List className="w-5 h-5" />
      </button>
      {expanded && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setExpanded(false)}>
          <div className="absolute bottom-20 right-6 bg-white rounded-xl shadow-2xl border border-zinc-200 p-4 w-64 max-h-[60vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <p className="text-[10px] font-medium tracking-widest uppercase text-[var(--yh-muted)]/50 mb-3">{t.onThisPage}</p>
            <nav className="space-y-1">
              {headings.map((h, idx) => (
                <a
                  key={h.id || `heading-${idx}`}
                  href={`#${h.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setExpanded(false);
                    setTimeout(() => document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" }), 100);
                  }}
                  className={`block text-[13px] leading-snug py-1.5 px-2 rounded transition-colors ${
                    active === h.id
                      ? "text-[var(--yh-accent)] bg-[var(--yh-accent)]/10 font-medium"
                      : "text-[var(--yh-muted)] hover:text-[var(--yh-text)] hover:bg-zinc-50"
                  }`}
                >
                  {h.text}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
