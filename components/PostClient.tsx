"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useLang } from "@/lib/lang-context";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { CategoryBadge } from "./CategoryBadge";
import { AuthorAvatar } from "./AuthorAvatar";
import { ReadingProgress } from "./ReadingProgress";
import { TableOfContents } from "./TableOfContents";
import { Footer } from "./Footer";
import { useRelativeTime, formatDisplayDate } from "@/lib/relative-time";
import { Lightbox } from "./Lightbox";
import type { Post } from "@/lib/types";
import type { PageConfig } from "@/lib/page-config";
import { catLabel } from "@/components/HomeClient";
import { ChevronLeft, ChevronRight, Clock, Calendar, ExternalLink } from "lucide-react";

const PostRenderer = dynamic(() => import("./editor/PostRenderer").then((m) => m.PostRenderer), {
  loading: () => <div className="animate-pulse h-96 bg-[var(--dash-card)]/30 rounded-none" />,
  ssr: false,
});

const REPO_MAP: Record<string, string> = {
  "soulsync-emotion-engine-architecture": "https://github.com/yahajiang/astrbot_plugin_soulsync",
  "tauri-react-print-assistant": "https://github.com/yahajiang/print-assistant",
  "soulsync-bistro-emotion-food": "https://github.com/yahajiang/astrbot_plugin_soulsync/tree/soulsync-bistro",
  "soulsync-mirror-self-exploration": "https://github.com/yahajiang/astrbot_plugin_soulsync/tree/soulsync_mirror",
  "soulsync-shield-prompt-injection": "https://github.com/yahajiang/astrbot_plugin_soulsync/tree/soulsync-shield",
  "soulsync-menu-image-generator": "https://github.com/yahajiang/astrbot_plugin_soulsync/tree/soulsync-menu",
};

export function PostClient({
  post: rawPost,
  rawPost: prismaRaw,
  prevPost,
  nextPost,
}: {
  post: Post;
  rawPost?: any;
  prevPost: Post | null;
  nextPost: Post | null;
}) {
  const { t, lang } = useLang();
  const relative = useRelativeTime(rawPost.createdAt || rawPost.date, lang);
  const post = lang === "zh"
    ? { ...rawPost, title: rawPost.titleZh || rawPost.title, excerpt: rawPost.excerptZh || rawPost.excerpt, html: rawPost.htmlZh || rawPost.html, headings: rawPost.headingsZh || rawPost.headings }
    : rawPost;
  const content = (prismaRaw as any)?.content || (rawPost as any).content
  const pageConfig = (prismaRaw as any)?.pageConfig as PageConfig | undefined
  const isDark = pageConfig?.theme === "dark"
  const isFullscreen = pageConfig?.layout === "fullscreen"
  const showTOC = !isFullscreen

  return (
    <div className="min-h-screen flex flex-col bg-[var(--yh-bg)]" style={{ backgroundColor: isDark ? "#1C1C1E" : pageConfig?.backgroundColor && pageConfig.backgroundColor !== "#FFFFFF" ? pageConfig.backgroundColor : undefined, color: isDark ? "#E5E5E7" : undefined, ...(pageConfig?.primaryColor ? { ["--yh-accent" as any]: pageConfig.primaryColor } : {}) } as any}>
      <div className="h-[3px] w-full bg-[var(--yh-accent)]" />
      <Lightbox />
      <ReadingProgress />

      {/* 顶部导航 */}
      <div className="sticky top-0 z-40 h-[53px] bg-[var(--yh-bg)]/80 backdrop-blur-xl border-b border-[var(--yh-border)]">
        <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-60 transition-opacity">
            <span className="w-[26px] h-[26px] rounded-full bg-zinc-900 text-white flex items-center justify-center serif italic text-[12px] shrink-0">S</span>
            <span className="flex items-baseline gap-1">
              <span className="font-semibold text-[15px] tracking-tight">慢日志</span>
              <span className="mono text-[12px] tracking-[0.14em] uppercase">· SLOWLOG</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/" className="mono text-[12px] tracking-[0.14em] uppercase text-[var(--yh-muted)] hover:text-[var(--yh-text)] transition-colors border border-[var(--yh-border)] px-3 py-[5px] bg-[var(--dash-card)] rounded-none">
              {t.backToPosts}
            </Link>
          </div>
        </div>
      </div>

      {/* 文章头部 — 杂志式 */}
      <section className={`${isFullscreen ? "pt-10 pb-8 bg-[var(--dash-card)]/40 border-b border-[var(--yh-border)]" : "pt-8 pb-6 md:pt-12"}`}>
        <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <CategoryBadge category={post.category} />
            <span className="text-[var(--yh-border)]">·</span>
            <span className="flex items-center gap-1 text-[11px] text-[var(--yh-muted)]">
              <Clock className="w-3 h-3" />{post.readTime}
            </span>
            <span className="text-[var(--yh-border)]">·</span>
            <span className="flex items-center gap-1 text-[11px] text-[var(--yh-muted)]">
              <Calendar className="w-3 h-3" />{formatDisplayDate(post.date, lang)}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[var(--yh-muted)]" data-reading-meta>
              <span className="text-[var(--yh-border)]">·</span>
              <span className="mono">{post.readTime}</span>
              <span className="opacity-40">·</span>
              <span className="opacity-60" data-remaining>{t.readingRemaining(10)}</span>
            </span>
            {((prismaRaw as any)?.repoUrl || (rawPost as any)?.repoUrl || REPO_MAP[rawPost.id]) && (
              <>
                <span className="text-[var(--yh-border)]">·</span>
                <a
                  href={(prismaRaw as any)?.repoUrl || (rawPost as any)?.repoUrl || REPO_MAP[rawPost.id]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-[var(--yh-muted)] hover:text-[var(--yh-accent)] transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />{t.viewRepo || "Repository"}
                </a>
              </>
            )}
          </div>

          <h1 className={`text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] mb-4 text-balance ${pageConfig?.fontFamily === "serif" ? "font-serif" : ""}`} style={{ color: isDark ? "#FFFFFF" : pageConfig?.primaryColor || undefined }}>
            {post.title}
          </h1>
          {/* 引言 — 斜体 + 左侧细线 */}
          <div className="border-l-[3px] pl-[18px] my-6" style={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "color-mix(in oklab, var(--yh-accent) 18%, transparent)" }}>
            <p className={`text-[17px] leading-[1.75] ${isDark ? "text-[var(--yh-muted)]" : "text-[var(--yh-muted)]"} italic`}>{post.excerpt}</p>
          </div>

          {/* 厚重作者卡 */}
          <div className={`flex items-center gap-4 py-4 px-4 -mx-4 rounded-none mt-6 ${isDark ? "bg-[var(--dash-card)]/[0.04] border border-white/10" : "bg-[var(--dash-card)] border border-[var(--yh-border)]"}`}>
            <AuthorAvatar initial={post.authorInitial} size="lg" />
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-zinc-800"}`}>{post.author}</p>
              <p className="text-xs text-[var(--yh-muted)] truncate">{relative} · {catLabel(post.category, t)} · {post.readTime}</p>
            </div>
            <div className="hidden sm:flex gap-1.5 flex-wrap justify-end max-w-[42%]">
              {post.tags.map((tag) => (
                <span key={tag} className={`text-[10px] px-2 py-1 rounded-none border ${isDark ? "text-zinc-300 bg-[var(--dash-card)]/5 border-white/10" : "text-[var(--yh-muted)] bg-[var(--dash-card)] border-[var(--yh-border)]"}`}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 正文内容 — 宽栏 + 侧栏常驻 */}
      <section className={`pb-16 ${isDark ? "bg-[var(--yh-bg)]" : ""}`}>
        <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6">
          <div className={`${isFullscreen ? "flex gap-8 max-w-6xl mx-auto" : "grid lg:grid-cols-[1fr_308px] gap-8"}`}>
            <article className={`min-w-0 ${isFullscreen ? "max-w-5xl mx-auto flex-1" : pageConfig?.maxWidth === "narrow" ? "max-w-2xl" : pageConfig?.maxWidth === "wide" ? "max-w-5xl" : "max-w-5xl"} ${isFullscreen ? "pt-8" : ""}`}>
              {content ? (
                <PostRenderer content={content} pageConfig={pageConfig} />
              ) : (
                <div
                  className="prose prose-zinc max-w-5xl
                  prose-p:text-[17px] prose-p:leading-[1.9] prose-p:text-[var(--yh-text)]/85 prose-p:mb-5 prose-p:font-light
                  prose-h1:text-3xl prose-h1:font-bold prose-h1:mt-10 prose-h1:mb-3 prose-h1:tracking-tight
                  prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-2 prose-h2:scroll-mt-[88px] prose-h2:tracking-tight prose-h2:border-b prose-h2:border-[var(--yh-border)] prose-h2:pb-2
                  prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-7 prose-h3:mb-1 prose-h4:text-base prose-h4:font-semibold prose-h4:mt-5 prose-h4:mb-1
                  prose-a:text-[var(--yh-accent)] prose-a:underline prose-a:underline-offset-4 prose-a:decoration-2 prose-a:hover:decoration-[var(--yh-accent)]
                  prose-strong:font-semibold prose-strong:text-zinc-900
                  prose-code:text-[13px] prose-code:bg-zinc-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-none prose-code:font-mono prose-code:text-rose-600 prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:p-4 prose-pre:rounded-none prose-pre:overflow-x-auto prose-pre:border prose-pre:border-zinc-800 prose-pre:shadow-lg
                  prose-blockquote:border-l-[3px] prose-blockquote:border-[var(--yh-accent)]/30 prose-blockquote:pl-5 prose-blockquote:text-zinc-600 prose-blockquote:italic prose-blockquote:bg-[var(--dash-card)]/50 prose-blockquote:py-1 prose-blockquote:pr-4 prose-blockquote:rounded-none
                  prose-ul:list-disc prose-ul:pl-6 prose-ul:marker:text-[var(--yh-muted)] prose-ol:list-decimal prose-ol:pl-6 prose-ol:marker:text-[var(--yh-muted)]
                  prose-li:text-[15px] prose-li:leading-[1.8] prose-li:mb-1
                  prose-hr:border-[var(--yh-border)] prose-hr:my-10
                  prose-img:rounded-none prose-img:my-7 prose-img:shadow-md prose-img:border prose-img:border-[var(--yh-border)]
                  prose-table:text-[14px] prose-table:border-collapse prose-table:w-full prose-table:my-7 prose-table:rounded-none prose-table:shadow-sm prose-table:border prose-table:border-[var(--yh-border)]
                  prose-th:border-b-2 prose-th:border-[var(--yh-border)] prose-th:bg-[var(--dash-card)] prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold prose-th:text-zinc-700 prose-th:text-[13px] prose-th:tracking-wide prose-th:uppercase
                  prose-td:border-b prose-td:border-[var(--yh-border)] prose-td:px-4 prose-td:py-3 prose-td:text-zinc-600 prose-td:align-top
                  prose-thead:border-b-2 prose-thead:border-[var(--yh-border)]"
                  dangerouslySetInnerHTML={{ __html: post.html }}
                />
              )}

              {/* 底部标签 */}
              <div className="flex flex-wrap gap-2 mt-12 pt-6 border-t border-[var(--yh-border)]">
                {post.tags.map((tag) => (
                  <span key={tag} className={`text-xs px-3 py-1.5 rounded-none border transition-colors cursor-default ${isDark ? "text-zinc-300 bg-[var(--dash-card)]/5 border-white/10" : "text-[var(--yh-muted)] bg-[var(--dash-card)] border-[var(--yh-border)] hover:bg-[var(--dash-card)]"}`}>
                    #{tag}
                  </span>
                ))}
              </div>

              {/* 版权声明 */}
              <div className={`mt-8 p-4 rounded-none text-[13px] leading-relaxed border ${isDark ? "bg-[var(--dash-card)]/[0.04] border-white/10 text-[var(--yh-muted)]" : "bg-[var(--dash-card)] border-[var(--yh-border)] text-[var(--yh-muted)]"}`}>
                <p>
                  {lang === "zh"
                    ? t.copyright(post.author, new Date().getFullYear())
                    : t.copyrightEn(post.author, new Date().getFullYear())}
                </p>
              </div>
            </article>

            {showTOC && <TableOfContents headings={post.headings} />}
          </div>
        </div>
      </section>

      {/* 上一篇/下一篇导航 · 间距加大、卡片收窄 */}
      <section className="border-t border-[var(--yh-border)] py-8 bg-[var(--dash-card)]/40">
        <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              {prevPost ? (
                <Link href={`/posts/${prevPost.id}`} className="group flex items-start gap-3 border border-[var(--yh-border)] bg-[var(--dash-card)] p-4 hover:border-[var(--yh-border)] hover:shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-300 hover:-translate-y-[1px] rounded-none transform-gpu [backface-visibility:hidden]">
                  <ChevronLeft className="w-4 h-4 text-zinc-300 group-hover:text-[var(--yh-accent)] shrink-0 mt-0.5 transition-colors" />
                  <div className="min-w-0">
                    <p className="text-[10px] tracking-widest uppercase text-[var(--yh-muted)] mb-1">{t.previous}</p>
                    <p className="text-sm font-medium text-zinc-900 group-hover:text-[var(--yh-accent)] transition-colors line-clamp-2">{prevPost.title}</p>
                    <p className="text-xs text-[var(--yh-muted)] mt-1">{formatDisplayDate(prevPost.date, lang)}</p>
                  </div>
                </Link>
              ) : (
                <div className="p-4 text-xs text-[var(--yh-muted)]">{t.noPrevious}</div>
              )}
            </div>
            <div>
              {nextPost ? (
                <Link href={`/posts/${nextPost.id}`} className="group flex items-start gap-3 border border-[var(--yh-border)] bg-[var(--dash-card)] p-4 hover:border-[var(--yh-border)] hover:shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-300 hover:-translate-y-[1px] rounded-none text-right transform-gpu [backface-visibility:hidden]">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] tracking-widest uppercase text-[var(--yh-muted)] mb-1">{t.next}</p>
                    <p className="text-sm font-medium text-zinc-900 group-hover:text-[var(--yh-accent)] transition-colors line-clamp-2">{nextPost.title}</p>
                    <p className="text-xs text-[var(--yh-muted)] mt-1">{formatDisplayDate(nextPost.date, lang)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[var(--yh-accent)] shrink-0 mt-0.5 transition-colors" />
                </Link>
              ) : (
                <div className="p-4 text-xs text-[var(--yh-muted)] text-right">{t.noNext}</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
