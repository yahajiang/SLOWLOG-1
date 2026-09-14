"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, ExternalLink, X } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CategoryBadge } from "@/components/CategoryBadge";
import { ReadingProgress } from "@/components/ReadingProgress";
import { TocDrawer } from "@/components/TocDrawer";
import { Lightbox } from "@/components/Lightbox";
import { MFooter } from "./MFooter";
import { parsePageConfig } from "@/lib/page-config";
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
  const pageConfig = parsePageConfig((prismaRaw as any)?.pageConfig);
  const [sysDark, setSysDark] = useState(false)

  // 浏览计数：每会话每篇一次（sessionStorage 去重；失败静默）
  useEffect(() => {
    try {
      const key = `sl-viewed:${post.id}`
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, "1")
      fetch(`/api/posts/${post.id}/view`, { method: "POST", keepalive: true }).catch(() => {})
    } catch {}
  }, [post.id])
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

      <main className="flex-1 flex flex-col">
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
              <p className="text-[15px] text-[var(--yh-muted)] py-6 text-center">内容暂缺，请稍后再试。</p>
            )}
            <div className="mt-8 p-4 rounded-none text-[13px] leading-relaxed border bg-[var(--dash-card)] border-[var(--yh-border)] text-[var(--yh-muted)]">
              <p>
                {lang === "zh"
                  ? t.copyright(post.author, new Date().getFullYear())
                  : t.copyrightEn(post.author, new Date().getFullYear())}
              </p>
            </div>
          </article>
          <TocDrawer headings={post.headings || []} />
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

      </main>
      <MFooter desktopHref={`/posts/${post.id}`} />
    </div>
  );
}
