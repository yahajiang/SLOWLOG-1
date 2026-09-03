"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Calendar, ExternalLink, List, X } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CategoryBadge } from "@/components/CategoryBadge";
import { AuthorAvatar } from "@/components/AuthorAvatar";
import { ReadingProgress } from "@/components/ReadingProgress";
import { Lightbox } from "@/components/Lightbox";
import { MFooter } from "./MFooter";
import { PostRenderer } from "@/components/editor/PostRenderer";
import { useRelativeTime, formatDisplayDate } from "@/lib/relative-time";
import { mCatLabel } from "@/lib/madapt";
import type { PageConfig } from "@/lib/page-config";

const REPO_MAP: Record<string, string> = {
  "soulsync-emotion-engine-architecture": "https://github.com/yahajiang/astrbot_plugin_soulsync",
  "tauri-react-print-assistant": "https://github.com/yahajiang/print-assistant",
  "soulsync-bistro-emotion-food": "https://github.com/yahajiang/astrbot_plugin_soulsync/tree/soulsync-bistro",
  "soulsync-mirror-self-exploration": "https://github.com/yahajiang/astrbot_plugin_soulsync/tree/soulsync_mirror",
  "soulsync-shield-prompt-injection": "https://github.com/yahajiang/astrbot_plugin_soulsync/tree/soulsync-shield",
  "soulsync-menu-image-generator": "https://github.com/yahajiang/astrbot_plugin_soulsync/tree/soulsync-menu",
};

function MTOC({ headings }: { headings: { id: string; text: string }[] }) {
  const [open, setOpen] = useState(false);
  const { t } = useLang();
  if (headings.length === 0) return null;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 z-40 w-12 h-12 bg-[var(--yh-text)] text-white rounded-none shadow-[0_8px_30px_-8px_rgba(0,0,0,0.3)] flex items-center justify-center active:opacity-90 border border-zinc-800"
        aria-label="TOC"
      >
        <List className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 mono text-[10px] bg-[var(--yh-accent)] text-white w-5 h-5 rounded-none flex items-center justify-center border-2 border-white">
          {headings.length}
        </span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="absolute bottom-0 inset-x-0 bg-[var(--dash-card)] rounded-none shadow-2xl border-t border-[var(--yh-border)] max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <span className="w-10 h-1 rounded-none bg-zinc-200" />
            </div>
            <div className="px-4 pb-3 flex items-center justify-between">
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
            <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-1">
              {headings.map((h, idx) => (
                <a
                  key={h.id || `heading-${idx}`}
                  href={`#${h.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setOpen(false);
                    setTimeout(() => {
                      document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 120);
                  }}
                  className="flex items-center gap-2 text-[15px] leading-snug py-3 px-3 rounded-none text-zinc-600 active:bg-zinc-100"
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-zinc-300" />
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

/** 移动端阅读页：mini 顶栏 + 全宽正文 + 纵向上下篇 + 抽屉目录 */
export function MPost({
  post: rawPost,
  rawPost: prismaRaw,
  prevPost,
  nextPost,
}: {
  post: any;
  rawPost?: any;
  prevPost: any | null;
  nextPost: any | null;
}) {
  const { t, lang } = useLang();
  const relative = useRelativeTime(rawPost.createdAt || rawPost.date, lang);
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
  const isDark = pageConfig?.theme === "dark";
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
            <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center serif italic text-[11px] shrink-0">S</span>
            <span className="font-semibold text-[14px] tracking-tight truncate">慢日志</span>
          </span>
          <LanguageSwitcher />
        </div>
      </div>

      <section className="pt-6 pb-5">
        <div className="w-full mx-auto px-4">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <CategoryBadge category={post.category} />
            <span className="flex items-center gap-1 text-[11px] text-[var(--yh-muted)]">
              <Clock className="w-3 h-3" />
              {post.readTime}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-[var(--yh-muted)]">
              <Calendar className="w-3 h-3" />
              {formatDisplayDate(post.date, lang)}
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
            className="text-[24px] font-semibold leading-[1.2] tracking-[-0.02em] mb-3"
            style={{ color: isDark ? "#FFFFFF" : pageConfig?.primaryColor || undefined }}
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

          <div className="flex items-center gap-3 py-3 px-3 -mx-1 rounded-none mt-4 bg-[var(--dash-card)] border border-[var(--yh-border)]">
            <AuthorAvatar initial={post.authorInitial} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-zinc-800">{post.author}</p>
              <p className="text-xs text-[var(--yh-muted)] truncate">
                {relative} · {mCatLabel(post.category, t)} · {post.readTime}
              </p>
            </div>
          </div>
          {post.tags?.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-3">
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-[11px] px-2 py-1 rounded-none border text-[var(--yh-muted)] bg-[var(--dash-card)] border-[var(--yh-border)]"
                >
                  #{tag}
                </span>
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

      <section className="border-t border-[var(--yh-border)] py-6 bg-[var(--dash-card)]/40">
        <div className="w-full mx-auto px-4">
          <div className="grid grid-cols-1 gap-3">
            {prevPost ? (
              <Link
                href={`/m/posts/${prevPost.id}`}
                className="flex items-start gap-3 border border-[var(--yh-border)] bg-[var(--dash-card)] p-4 rounded-none active:bg-zinc-50"
              >
                <ChevronLeft className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] tracking-widest uppercase text-[var(--yh-muted)] mb-1">{t.previous}</p>
                  <p className="text-sm font-medium text-zinc-900 line-clamp-2">
                    {lang === "zh" ? prevPost.titleZh || prevPost.title : prevPost.title}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="p-4 text-xs text-[var(--yh-muted)]">{t.noPrevious}</div>
            )}
            {nextPost ? (
              <Link
                href={`/m/posts/${nextPost.id}`}
                className="flex items-start gap-3 border border-[var(--yh-border)] bg-[var(--dash-card)] p-4 rounded-none active:bg-zinc-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] tracking-widest uppercase text-[var(--yh-muted)] mb-1">{t.next}</p>
                  <p className="text-sm font-medium text-zinc-900 line-clamp-2">
                    {lang === "zh" ? nextPost.titleZh || nextPost.title : nextPost.title}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
              </Link>
            ) : (
              <div className="p-4 text-xs text-[var(--yh-muted)]">{t.noNext}</div>
            )}
          </div>
        </div>
      </section>

      <MFooter desktopHref={`/posts/${post.id}`} />
    </div>
  );
}
