"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/lang-context";
import { PROGRESS_EVENT } from "@/lib/hooks/use-scroll-spy";

type ProgressDetail = { progress: number; articleProgress: number };

export function ReadingProgress() {
  const { t } = useLang();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // 目录（桌面 TOC / 移动端 MTOC）存在时，进度由 useScrollSpy 广播，顶栏不再自算，
  // 否则两套算法会打架（历史上顶栏因此慢一拍）。只有无目录的页面才走本地兜底。
  const external = useRef(false);

  useEffect(() => {
    function paint(pct: number, articlePct: number) {
      const p = Math.min(100, Math.max(0, pct));
      setProgress(p);
      setVisible(window.scrollY > 120);
      const mins = Math.max(1, Math.round((100 - p) * 0.08));
      // 剩余时间直接写入占位节点（P2-4）。配套改动：PostClient 中该节点已改为
      // 空占位 <span data-remaining /> —— 否则 React 每次重渲染都会把文案打回初始值，
      // 造成"命令式写入 vs 虚拟 DOM"双源互相覆盖。
      const el = document.querySelector("[data-remaining]") as HTMLElement | null;
      if (el)
        el.textContent =
          articlePct >= 100 ? t.readDone : mins <= 1 ? t.almostDone : t.readingRemaining(mins);
    }

    function onBroadcast(e: Event) {
      const d = (e as CustomEvent<ProgressDetail>).detail;
      if (!d) return;
      external.current = true;
      paint(d.progress * 100, d.articleProgress);
    }

    let rafId: number;

    function handleScroll() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // 已有广播来源（本页有目录）→ 完全交给它，避免回写旧值
        if (external.current) return;

        const article = document.querySelector("article") as HTMLElement | null;
        let pct = 0;
        if (article) {
          const rect = article.getBoundingClientRect();
          const articleTop = window.scrollY + rect.top;
          const articleBottom = articleTop + article.offsetHeight;
          const viewBottom = window.scrollY + window.innerHeight;
          const start = articleTop - 96;
          const finish = articleBottom - window.innerHeight;
          if (finish > start) {
            pct = ((window.scrollY - start) / (finish - start)) * 100;
          } else {
            pct = viewBottom >= articleBottom - 8 ? 100 : 0;
          }
          pct = Math.min(100, Math.max(0, pct));
          const doc = document.documentElement;
          if (window.scrollY + window.innerHeight >= doc.scrollHeight - 8) pct = 100;
        } else {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        }
        paint(pct, pct);

        // 无目录页的段落聚焦：当前阅读段保持实色，其余压暗。
        // P2-5：先批量读几何、再批量写样式。旧实现把 getBoundingClientRect() 与
        // style 写入交错在同一循环里，每次迭代都强制一次样式重算/重排（layout thrashing），
        // 长文滚动明显掉帧。
        const paras = Array.from(document.querySelectorAll("[data-paragraph]")) as HTMLElement[];
        const rects = paras.map((el) => el.getBoundingClientRect());
        const mid = window.innerHeight * 0.45;
        let bestIdx = -1;
        let bestDist = Infinity;
        rects.forEach((r, i) => {
          if (r.top < window.innerHeight && r.bottom > 0) {
            const d = Math.abs(r.top + r.height / 2 - mid);
            if (d < bestDist) { bestDist = d; bestIdx = i }
          }
        });
        paras.forEach((el, i) => {
          // transition 只在首次写入，避免每帧重置
          if (!el.style.transition) el.style.transition = "opacity 0.3s var(--ease-out)";
          el.style.opacity = i === bestIdx ? "1" : "0.72";
        });
      });
    }

    window.addEventListener(PROGRESS_EVENT, onBroadcast);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    // 首帧正文尚未撑开高度时，兜底算法会把 scrollHeight 误当成「已到底」而报 100%；
    // 内容长高后重新评估一次。
    const ro = new ResizeObserver(() => handleScroll());
    ro.observe(document.body);
    handleScroll();
    return () => {
      window.removeEventListener(PROGRESS_EVENT, onBroadcast);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      ro.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [t]);

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 z-[60] h-[2px] pointer-events-none transition-opacity duration-300 ${visible ? "opacity-60" : "opacity-0"}`}>
        <div
          className="h-full w-full origin-left transition-transform duration-150 ease-out"
          style={{
            transform: `scaleX(${progress / 100})`,
            background: "var(--yh-accent)",
          }}
        />
      </div>
    </>
  );
}
