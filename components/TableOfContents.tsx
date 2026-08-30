"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/lang-context";

export function TableOfContents({
  headings,
}: {
  headings: { id: string; text: string }[];
}) {
  const [active, setActive] = useState("");
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
    <aside className="hidden lg:block w-48 shrink-0">
      <div className="sticky top-24">
        <p className="text-[10px] font-medium tracking-widest uppercase text-[var(--yh-muted)]/50 mb-4">
          {t.onThisPage}
        </p>
        <nav className="space-y-2 border-l border-[var(--yh-border)] pl-4">
          {headings.map((h, idx) => (
            <a
              key={h.id || `heading-${idx}`}
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(h.id)
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`block text-[13px] leading-snug transition-all duration-300 border-l-2 -ml-[17px] pl-4 ${
                active === h.id
                  ? "text-[var(--yh-accent)] border-[var(--yh-accent)] translate-x-0.5 font-medium"
                  : "text-[var(--yh-muted)] border-transparent hover:text-[var(--yh-text)] hover:border-zinc-300"
              }`}
              style={{ transitionTimingFunction: "var(--ease-spring)" }}
            >
              {h.text}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
