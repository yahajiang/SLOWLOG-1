"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/lang-context";

export function ReadingProgress() {
  const { t } = useLang();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [remaining, setRemaining] = useState<string>("");

  useEffect(() => {
    let rafId: number;

    function handleScroll() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const article = document.querySelector("article") as HTMLElement | null;
        let pct = 0;
        if (article) {
          const rect = article.getBoundingClientRect();
          const top = window.scrollY + rect.top;
          const height = article.offsetHeight - window.innerHeight;
          const scrolled = window.scrollY - top;
          pct = height > 0 ? (scrolled / height) * 100 : 0;
          pct = Math.min(100, Math.max(0, pct));
        } else {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        }
        setProgress(pct);
        setVisible(window.scrollY > 120);
        // 剩余时间（按 300字/分钟 粗算）
        const remainPct = Math.max(0, 100 - pct);
        const mins = Math.max(1, Math.round(remainPct * 0.08));
        setRemaining(t.readingRemaining(mins));
        // 头部 meta 剩余时间同步
        const el = document.querySelector("[data-remaining]") as HTMLElement | null;
        if (el) el.textContent = mins <= 1 ? t.almostDone : t.readingRemaining(mins);
        // 侧栏进度卡同步
        const sideBar = document.querySelector("[data-side-progress]") as HTMLElement | null;
        if (sideBar) sideBar.style.width = `${pct}%`;
        const sideText = document.querySelector("[data-side-progress-text]") as HTMLElement | null;
        if (sideText) sideText.textContent = `${Math.round(pct)}% · ${t.estimatedTime(mins)}`;
        // 段落高亮：当前视口中点附近的段落
        const paras = Array.from(document.querySelectorAll("[data-paragraph]")) as HTMLElement[];
        let best: HTMLElement | null = null;
        let bestDist = Infinity;
        const mid = window.innerHeight * 0.45;
        for (const p of paras) {
          const r = p.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) {
            const d = Math.abs(r.top + r.height / 2 - mid);
            if (d < bestDist) { bestDist = d; best = p }
          }
          p.style.opacity = "0.72";
          p.style.transition = "opacity 0.3s var(--ease-out)";
        }
        if (best) best.style.opacity = "1";
      });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [t]);

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 z-[60] h-[3px] pointer-events-none transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
        <div
          className="h-full transition-[width] duration-150 ease-out"
          style={{
            width: `${progress}%`,
            background: "var(--yh-accent)",
          }}
        />
      </div>
    </>
  );
}
