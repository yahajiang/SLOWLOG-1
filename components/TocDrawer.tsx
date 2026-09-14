"use client";

/**
 * 目录抽屉（共享）：移动端 MPost 与平板树 /t 共用。
 * 自 MPost.MTOC 泛化——FAB（48×48 + 计数角标）+ 底部抽屉（sheet-in/out）
 * + 背景滚动锁 + 当前项滚入视野 + 48px 触控行 + 进度条。
 *
 * createPortal 到 body：页面根的入场动画（pageIn）会残留 transform，
 * 使祖先成为 position:fixed 的包含块——门户挂载让 FAB/抽屉永远相对视口。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { List } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { useScrollSpy } from "@/lib/hooks/use-scroll-spy";

export function TocDrawer({
  headings,
  offsetPx = 64,
  hideOnLg = false,
}: {
  headings: { id: string; text: string }[];
  offsetPx?: number;
  /** ≥lg 时隐藏 FAB——与桌面侧栏目录互斥（portal 内容不受外层 CSS 影响，需自带断点） */
  hideOnLg?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const { t } = useLang();
  const { activeIdx, progress, scrollToHeading } = useScrollSpy(headings, { offsetPx });
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  const requestClose = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 200);
  }, []);

  // 抽屉打开时锁背景滚动 + 把当前项滚进列表视野
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const item = list.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    item?.scrollIntoView({ block: "nearest" });
  }, [open, activeIdx]);

  if (!mounted || headings.length === 0) return null;

  return createPortal(
    <>
      <button
        onClick={() => setOpen(true)}
        className={`${hideOnLg ? "lg:hidden " : ""}fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-4 z-40 w-12 h-12 bg-[var(--yh-text)] text-[var(--yh-bg)] rounded-none shadow-[0_8px_30px_-8px_rgba(0,0,0,0.3)] flex items-center justify-center active:opacity-90`}
        aria-label="TOC"
        hidden={open}
      >
        <List className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 mono text-[10px] bg-[var(--yh-accent)] text-[var(--yh-bg)] w-5 h-5 rounded-none flex items-center justify-center border-2 border-[var(--yh-bg)]">
          {headings.length}
        </span>
      </button>
      {open && (
        <div className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm ${closing ? "mask-out" : "mask-in"}`} onClick={requestClose}>
          <div
            className={`absolute bottom-0 inset-x-0 bg-[var(--dash-card)] rounded-none shadow-2xl border-t border-[var(--yh-border)] max-h-[75vh] flex flex-col pb-[env(safe-area-inset-bottom)] ${closing ? "sheet-out" : "sheet-in"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <span className="w-10 h-1 rounded-none bg-[var(--yh-muted)]" />
            </div>
            <div className="px-4 pb-2 flex items-center justify-between">
              <p className="text-[11px] font-medium tracking-widest uppercase text-[var(--yh-muted)]">
                {t.onThisPage} · {headings.length}
              </p>
              <button
                onClick={requestClose}
                className="mono text-[11px] px-3 py-2 rounded-none border border-[var(--yh-border)] min-h-[44px]"
              >
                Close
              </button>
            </div>

            {/* 目录进度条：文末必须能打满 100% */}
            <div className="px-4 pb-3">
              <div className="h-[3px] bg-[var(--yh-border)]/70 overflow-hidden">
                <div
                  className="h-full origin-left bg-[var(--yh-accent)]"
                  style={{
                    transform: `scaleX(${progress})`,
                    transition: "transform 160ms linear",
                  }}
                />
              </div>
              <p className="mono text-[10px] tabular-nums text-[var(--yh-muted)]/80 mt-1.5 text-right">
                {Math.round(progress * 100)}%
              </p>
            </div>

            {/* min-h-0：flex 子项默认 min-height:auto，不加则最后一项被裁且滚不动 */}
            <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pb-6 space-y-1">
              {headings.map((h, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <a
                    key={h.id || `heading-${idx}`}
                    data-idx={idx}
                    href={`#${h.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      requestClose();
                      // 等抽屉退场动画结束后再滚动
                      setTimeout(() => scrollToHeading(h.id), 220);
                    }}
                    className={`flex items-center gap-2 text-[15px] leading-snug py-3 px-3 rounded-none min-h-[48px] active:bg-[var(--yh-border)] ${
                      isActive
                        ? "text-[var(--yh-accent)] bg-[var(--yh-accent)]/[0.07] font-medium"
                        : "text-[var(--yh-muted)]"
                    }`}
                  >
                    <span
                      className={`shrink-0 rounded-full ${
                        isActive
                          ? "w-1.5 h-1.5 bg-[var(--yh-accent)]"
                          : "w-1.5 h-1.5 bg-[var(--yh-border)]"
                      }`}
                    />
                    {h.text}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
