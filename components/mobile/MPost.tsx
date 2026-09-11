"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, ExternalLink, List, X } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CategoryBadge } from "@/components/CategoryBadge";
import { ReadingProgress } from "@/components/ReadingProgress";
import { Lightbox } from "@/components/Lightbox";
import { MFooter } from "./MFooter";
import { PostRenderer } from "@/components/editor/PostRenderer";
import { formatDisplayDate } from "@/lib/relative-time";
import type { PageConfig } from "@/lib/page-config";

const REPO_MAP: Record<string, string> = {
  "soulsync-emotion-engine-architecture": "https://github.com/yahajiang/astrbot_plugin_soulsync",
  "tauri-react-print-assistant": "https://github.com/yahajiang/print-assistant",
  "soulsync-bistro-emotion-food": "https://github.com/yahajiang/astrbot_plugin_soulsync/tree/soulsync-bistro",
  "soulsync-mirror-self-exploration": "https://github.com/yahajiang/astrbot_plugin_soulsync/tree/soulsync_mirror",
  "soulsync-shield-prompt-injection": "https://github.com/yahajiang/astrbot_plugin_soulsync/tree/soulsync-shield",
  "soulsync-menu-image-generator": "https://github.com/yahajiang/astrbot_plugin_soulsync/tree/soulsync-menu",
};

function useActiveHeading(headings: { id: string; text: string }[], enabled: boolean) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!enabled || headings.length === 0) return;
    const ids = headings.map((h) => h.id).filter(Boolean);
    if (ids.length === 0) return;

    function sync() {
      const els = ids
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => !!el);
      if (els.length === 0) return;

      // 顶栏 56px + 余量：当前节判定线
      const line = 72;
      let curIdx = 0;
      els.forEach((el, i) => {
        if (el.getBoundingClientRect().top <= line) curIdx = i;
      });

      // 文末兜底：滚到视口底部附近时强制末节（否则最后一节高亮/进度永远到不了 100%）
      const doc = document.documentElement;
      const nearBottom = window.scrollY + window.innerHeight >= doc.scrollHeight - 48;
      if (nearBottom) curIdx = els.length - 1;

      setActiveIdx(curIdx);

      const n = els.length;
      if (n === 1) {
        setProgress(nearBottom || window.scrollY > 80 ? 1 : 0);
        return;
      }
      if (curIdx >= n - 1 || nearBottom) {
        setProgress(1);
        return;
      }
      const lineY = window.scrollY + line;
      const curTop = els[curIdx].getBoundingClientRect().top + window.scrollY;
      const nextTop = els[curIdx + 1].getBoundingClientRect().top + window.scrollY;
      const span = Math.max(1, nextTop - curTop);
      const local = Math.min(1, Math.max(0, (lineY - curTop) / span));
      setProgress((curIdx + local) / n);
    }

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sync);
    };
    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [enabled, headings]);

  return { activeIdx, progress };
}

function MTOC({ headings }: { headings: { id: string; text: string }[] }) {
  const [open, setOpen] = useState(false);
  const { t } = useLang();
  const { activeIdx, progress } = useActiveHeading(headings, true);
  const listRef = useRef<HTMLDivElement | null>(null);

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

  if (headings.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-4 z-40 w-12 h-12 bg-[var(--yh-text)] text-[var(--yh-bg)] rounded-none shadow-[0_8px_30px_-8px_rgba(0,0,0,0.3)] flex items-center justify-center active:opacity-90"
        aria-label="TOC"
        hidden={open}
      >
        <List className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 mono text-[10px] bg-[var(--yh-accent)] text-[var(--yh-bg)] w-5 h-5 rounded-none flex items-center justify-center border-2 border-[var(--yh-bg)]">
          {headings.length}
        </span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="absolute bottom-0 inset-x-0 bg-[var(--dash-card)] rounded-none shadow-2xl border-t border-[var(--yh-border)] max-h-[75vh] flex flex-col pb-[env(safe-area-inset-bottom)]"
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
                onClick={() => setOpen(false)}
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
                      setOpen(false);
                      setTimeout(() => {
                        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                        document.getElementById(h.id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
                      }, 120);
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
    </>
  );
}

/** 移动端阅读页：mini 顶栏 + 全宽正文 + 纵向上下篇 + 抽屉目录 */
export function MPost({
  post: rawPost,
  rawPost: prismaRaw,
  prev,
  next,
}: {
  post: any;
  rawPost?: any;
  prev?: { id: string; title: string; titleZh?: string } | null;
  next?: { id: string; title: string; titleZh?: string } | null;
}) {
  const { t, lang } = useLang();
  const post =
    lang === "zh"
      ? {
          ...rawPost,
          title: rawPost.titleZh || rawPost.title,
          excerpt: rawPost.excerptZh || rawPost.excerpt,
          html: rawPost.htmlZh || rawPost.html,
          headings: rawPost.headingsZh || rawPost.headings,
        }
      : rawPost;
  const content = (prismaRaw as any)?.content || (rawPost as any).content;
  const pageConfig = (prismaRaw as any)?.pageConfig as PageConfig | undefined;
  const [sysDark, setSysDark] = useState(false)
  useEffect(() => {
    if (pageConfig?.theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    setSysDark(mq.matches);
    const fn = (e: MediaQueryListEvent) => setSysDark(e.matches);
    mq.addEventListener("change", fn)
    return () => mq.removeEventListener("change", fn);
  }, [pageConfig?.theme])
  const isDark = pageConfig?.theme === "dark" || (pageConfig?.theme === "system" && sysDark)
  const repoUrl =
    (prismaRaw as any)?.repoUrl || (rawPost as any)?.repoUrl || REPO_MAP[rawPost.id];

  return (
    <div data-m="1" className="min-h-screen flex flex-col bg-[var(--yh-bg)]">
      <Lightbox />
      <ReadingProgress />
      <div className="sticky top-0 z-40 h-14 bg-[var(--yh-bg)]/90 backdrop-blur-xl border-b border-[var(--yh-border)]">
        <div className="w-full mx-auto px-4 h-full flex items-center justify-between gap-2">
          <Link
            href="/m"
            className="w-11 h-11 flex items-center justify-center text-[var(--yh-text)] -ml-2"
            aria-label="Back"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className="flex items-center gap-1.5 min-w-0">
            <span className="w-6 h-6 rounded-full bg-[var(--yh-text)] text-[var(--yh-bg)] flex items-center justify-center serif italic text-[11px] shrink-0">S</span>
            <span className="font-semibold text-[14px] tracking-tight truncate">慢日志</span>
          </span>
          <LanguageSwitcher size="sm" />
        </div>
      </div>

      <section className="pt-6 pb-5">
        <div className="w-full mx-auto px-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <CategoryBadge category={post.category} />
            <span className="text-[11px] text-[var(--yh-muted)]">
              {post.author}
            </span>
            <span className="text-[var(--yh-border)]">·</span>
            <span className="text-[11px] text-[var(--yh-muted)]">
              {formatDisplayDate(post.date, lang)}
            </span>
            <span className="text-[var(--yh-border)]">·</span>
            <span className="flex items-center gap-1 text-[11px] text-[var(--yh-muted)]">
              <Clock className="w-3 h-3" />
              {post.readTime}
            </span>
            {repoUrl && (
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-[var(--yh-muted)] min-h-[44px]"
              >
                <ExternalLink className="w-3 h-3" />
                {t.viewRepo || "Repository"}
              </a>
            )}
          </div>

          <h1
            className="text-[24px] font-semibold leading-[1.2] tracking-[-0.02em] mb-3 break-words"
            style={{ color: isDark ? "var(--yh-text)" : pageConfig?.primaryColor || undefined }}
          >
            {post.title}
          </h1>
          <div
            className="border-l-[3px] pl-4 my-5"
            style={{
              borderColor: isDark
                ? "rgba(255,255,255,0.15)"
                : "color-mix(in oklab, var(--yh-accent) 18%, transparent)",
            }}
          >
            <p className="text-[15px] leading-[1.75] text-[var(--yh-muted)] italic">{post.excerpt}</p>
          </div>
          {post.tags?.length > 0 && (
            <div className="flex gap-x-2 gap-y-1 flex-wrap mt-2 mb-1">
              {post.tags.slice(0, 3).map((tag: string) => (
                <span key={tag} className="text-[11px] text-[var(--yh-muted)]/75">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pb-10">
        <div className="w-full mx-auto px-4">
          <article className="min-w-0">
            {content ? (
              <PostRenderer content={content} pageConfig={pageConfig} />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: post.html }} />
            )}
            <div className="mt-8 p-4 rounded-none text-[13px] leading-relaxed border bg-[var(--dash-card)] border-[var(--yh-border)] text-[var(--yh-muted)]">
              <p>
                {lang === "zh"
                  ? t.copyright(post.author, new Date().getFullYear())
                  : t.copyrightEn(post.author, new Date().getFullYear())}
              </p>
            </div>
          </article>
          <MTOC headings={post.headings || []} />
        </div>
      </section>

      {(prev || next) && (
        <section className="px-4 pb-8">
          <div className="grid grid-cols-1 gap-3">
            {prev && (
              <Link
                href={`/m/posts/${prev.id}`}
                className="flex items-center gap-3 border border-[var(--yh-border)] bg-[var(--dash-card)] px-4 py-4 min-h-[64px] active:bg-[var(--yh-border)]/40"
              >
                <ChevronLeft className="w-5 h-5 text-[var(--yh-muted)] shrink-0" />
                <div className="min-w-0">
                  <p className="mono text-[10px] tracking-[0.14em] uppercase text-[var(--yh-muted)] mb-0.5">{t.previous}</p>
                  <p className="text-[14px] text-[var(--yh-text)] leading-snug truncate">{lang === "zh" ? prev.titleZh || prev.title : prev.title}</p>
                </div>
              </Link>
            )}
            {next && (
              <Link
                href={`/m/posts/${next.id}`}
                className="flex items-center gap-3 justify-end text-right border border-[var(--yh-border)] bg-[var(--dash-card)] px-4 py-4 min-h-[64px] active:bg-[var(--yh-border)]/40"
              >
                <div className="min-w-0">
                  <p className="mono text-[10px] tracking-[0.14em] uppercase text-[var(--yh-muted)] mb-0.5">{t.next}</p>
                  <p className="text-[14px] text-[var(--yh-text)] leading-snug truncate">{lang === "zh" ? next.titleZh || next.title : next.title}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--yh-muted)] shrink-0" />
              </Link>
            )}
          </div>
        </section>
      )}

      <MFooter desktopHref={`/posts/${post.id}`} />
    </div>
  );
}
