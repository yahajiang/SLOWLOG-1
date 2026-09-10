"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLang } from "@/lib/lang-context";
import { getReadProgress, saveReadProgress, clearReadProgress } from "@/lib/read-progress";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { CategoryBadge } from "./CategoryBadge";
import { ReadingProgress } from "./ReadingProgress";
import { TableOfContents } from "./TableOfContents";
import { Footer } from "./Footer";
import { useRelativeTime, formatDisplayDate } from "@/lib/relative-time";
import { Lightbox } from "./Lightbox";
import type { Post } from "@/lib/types";
import type { PageConfig } from "@/lib/page-config";
import { ChevronRight, Clock, ExternalLink, Search } from "lucide-react";

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
  relatedPosts = [],
}: {
  post: Post;
  rawPost?: any;
  relatedPosts?: Post[];
}) {
  const { t, lang } = useLang();
  const relative = useRelativeTime(rawPost.createdAt || rawPost.date, lang);
  const post = lang === "zh"
    ? { ...rawPost, title: rawPost.titleZh || rawPost.title, excerpt: rawPost.excerptZh || rawPost.excerpt, html: rawPost.htmlZh || rawPost.html, headings: rawPost.headingsZh || rawPost.headings }
    : rawPost;
  const content = (prismaRaw as any)?.content || (rawPost as any).content
  const pageConfig = (prismaRaw as any)?.pageConfig as PageConfig | undefined
  const [sysDark, setSysDark] = useState(false)
  useEffect(() => {
    if (pageConfig?.theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    setSysDark(mq.matches)
    const fn = (e: MediaQueryListEvent) => setSysDark(e.matches)
    mq.addEventListener("change", fn)
    return () => mq.removeEventListener("change", fn)
  }, [pageConfig?.theme])
  const isDark = pageConfig?.theme === "dark" || (pageConfig?.theme === "system" && sysDark)
  const isFullscreen = pageConfig?.layout === "fullscreen"
  const showTOC = !isFullscreen

  // 继续阅读（v0.3 P1-9）：记录滚动深度 + 重访提示条
  const postId = rawPost.id || post.id
  const [resumePct, setResumePct] = useState<number | null>(null)
  const [portalReady, setPortalReady] = useState(false)
  useEffect(() => setPortalReady(true), [])
  useEffect(() => {
    const saved = getReadProgress(postId)
    if (saved && saved > 10 && saved < 92) setResumePct(saved)
  }, [postId])
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    function onScroll() {
      if (timer) return
      timer = setTimeout(() => {
        timer = null
        const doc = document.documentElement
        const total = doc.scrollHeight - window.innerHeight
        if (total <= 0) return
        const pct = Math.min(100, Math.round((window.scrollY / total) * 100))
        if (pct >= 98) clearReadProgress(postId)
        else if (pct > 3) saveReadProgress(postId, pct)
      }, 400)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (timer) clearTimeout(timer)
    }
  }, [postId])

  const jumpToResume = () => {
    const doc = document.documentElement
    const total = doc.scrollHeight - window.innerHeight
    if (resumePct != null && total > 0) window.scrollTo({ top: (total * resumePct) / 100, behavior: "smooth" })
    setResumePct(null)
  }

  return (
    <div className={`min-h-screen flex flex-col bg-[var(--yh-bg)] text-[var(--yh-text)] ${isDark ? "dark" : ""} ${pageConfig?.theme === "light" ? "sl-force-light" : ""}`} style={{ ...(pageConfig?.backgroundColor && pageConfig.backgroundColor !== "#FFFFFF" && !isDark ? { backgroundColor: pageConfig.backgroundColor } : {}), ...(pageConfig?.primaryColor ? { ["--yh-accent" as any]: pageConfig.primaryColor } : {}) } as any}>
      <div className="h-[3px] w-full bg-[var(--yh-accent)]" />
      <Lightbox />
      <ReadingProgress />

      {/* 继续阅读提示条：Portal 直挂 body——固定悬浮视口底部，滚动时始终可见，不受 transform 祖先劫持 */}
      {portalReady && resumePct !== null && createPortal(
        <div id="sl-resume-bar" className="fixed left-1/2 -translate-x-1/2 z-40 animate-[pageIn_0.35s_var(--ease-out)_both]" style={{ bottom: 24 }}>
          <div className="flex items-center gap-3 bg-[var(--dash-card)] border border-[var(--yh-border)] shadow-[var(--shadow-float)] px-4 py-2.5 rounded-none">
            <span className="mono text-[11px] text-[var(--yh-muted)] whitespace-nowrap">
              {lang === "zh" ? `上次读到 ${resumePct}%` : `Left off at ${resumePct}%`}
            </span>
            <button
              onClick={jumpToResume}
              className="mono text-[11px] tracking-[.1em] uppercase px-3 py-1 bg-[var(--yh-text)] text-[var(--yh-bg)] hover:bg-[var(--yh-accent)] transition-colors rounded-none whitespace-nowrap"
            >
              {lang === "zh" ? "继续" : "Resume"}
            </button>
            <button
              onClick={() => setResumePct(null)}
              className="mono text-[11px] text-[var(--yh-muted)] hover:text-[var(--yh-text)] transition-colors px-1"
              aria-label={lang === "zh" ? "关闭" : "Dismiss"}
            >
              ✕
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 顶部导航 */}
      <div className="sticky top-0 z-40 h-[53px] bg-[var(--yh-bg)]/80 backdrop-blur-xl border-b border-[var(--yh-border)]">
        <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-60 transition-opacity">
            <span className="w-[26px] h-[26px] rounded-full bg-[var(--yh-text)] text-[var(--yh-bg)] flex items-center justify-center serif italic text-[12px] shrink-0">S</span>
            <span className="flex items-baseline gap-1">
              <span className="font-semibold text-[15px] tracking-tight">慢日志</span>
              <span className="mono text-[12px] tracking-[0.14em] uppercase">· SLOWLOG</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("sl-open-search"))}
              className="w-[34px] h-[30px] flex items-center justify-center border border-[var(--yh-border)] bg-[var(--dash-card)] text-[var(--yh-muted)] hover:text-[var(--yh-text)] hover:border-[var(--yh-muted)] transition-colors rounded-none"
              aria-label={lang === "zh" ? "全局搜索" : "Search"}
              title={lang === "zh" ? "全局搜索（/）" : "Search (/)"}
            >
              <Search className="w-3.5 h-3.5" />
            </button>
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
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[var(--yh-muted)]" data-reading-meta>
              <Clock className="w-3 h-3" />
              <span data-remaining>{t.readingRemaining(10)}</span>
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

          <h1 className={`text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] mb-3 text-balance ${pageConfig?.fontFamily === "serif" ? "font-serif" : ""}`} style={{ color: isDark ? "var(--yh-text)" : pageConfig?.primaryColor || undefined }}>
            {post.title}
          </h1>
          {/* 一行 meta：分类由顶栏 badge 承担，此处不再重复 */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--yh-muted)] mb-3">
            <span>{post.author}</span>
            <span className="opacity-40">·</span>
            <span>{relative}</span>
            <span className="opacity-40">·</span>
            <span>{post.readTime}</span>
          </div>
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-x-2 gap-y-1 mb-4">
              {post.tags.slice(0, 3).map((tag) => (
                <span key={tag} className={`text-[11px] ${isDark ? "text-zinc-400" : "text-[var(--yh-muted)]/75"}`}>#{tag}</span>
              ))}
            </div>
          )}
          {/* 引言 — 斜体 + 左侧细线 */}
          <div className="border-l-[3px] pl-4 my-5" style={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "color-mix(in oklab, var(--yh-accent) 18%, transparent)" }}>
            <p className="text-[16px] leading-[1.75] text-[var(--yh-muted)] italic">{post.excerpt}</p>
          </div>
        </div>
      </section>

      {/* 正文内容 — 宽栏 + 侧栏常驻 */}
      <section className={`pb-16 ${isDark ? "bg-[var(--yh-bg)]" : ""}`}>
        <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6">
          <div className={`${isFullscreen ? "flex gap-8 max-w-6xl mx-auto" : "grid lg:grid-cols-[1fr_308px] gap-8"}`}>
            <article className={`min-w-0 ${isFullscreen ? "max-w-3xl mx-auto flex-1" : pageConfig?.maxWidth === "narrow" ? "max-w-2xl" : pageConfig?.maxWidth === "wide" ? "max-w-4xl" : "max-w-3xl"} ${isFullscreen ? "pt-8" : ""}`}>
              {content ? (
                <PostRenderer content={content} pageConfig={pageConfig} isDark={isDark || pageConfig?.theme === "dark"} />
              ) : (
                <div
                  className="prose prose-zinc max-w-none
                  prose-p:text-[17px] prose-p:leading-[1.9] prose-p:text-[var(--yh-text)]/85 prose-p:mb-5 prose-p:font-light
                  prose-h1:text-3xl prose-h1:font-bold prose-h1:mt-10 prose-h1:mb-3 prose-h1:tracking-tight
                  prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-2 prose-h2:scroll-mt-[88px] prose-h2:tracking-tight prose-h2:border-b prose-h2:border-[var(--yh-border)] prose-h2:pb-2
                  prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-7 prose-h3:mb-1 prose-h4:text-base prose-h4:font-semibold prose-h4:mt-5 prose-h4:mb-1
                  prose-a:text-[var(--yh-accent)] prose-a:underline prose-a:underline-offset-4 prose-a:decoration-2 prose-a:hover:decoration-[var(--yh-accent)]
                  prose-strong:font-semibold prose-strong:text-[var(--yh-text)]
                  prose-code:text-[13px] prose-code:bg-[var(--yh-border)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-none prose-code:font-mono prose-code:text-rose-600 prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:p-4 prose-pre:rounded-none prose-pre:overflow-x-auto prose-pre:border prose-pre:border-zinc-800 prose-pre:shadow-lg
                  prose-blockquote:border-l-[3px] prose-blockquote:border-[var(--yh-accent)]/30 prose-blockquote:pl-5 prose-blockquote:text-[var(--yh-muted)] prose-blockquote:italic prose-blockquote:bg-[var(--dash-card)]/50 prose-blockquote:py-1 prose-blockquote:pr-4 prose-blockquote:rounded-none
                  prose-ul:list-disc prose-ul:pl-6 prose-ul:marker:text-[var(--yh-muted)] prose-ol:list-decimal prose-ol:pl-6 prose-ol:marker:text-[var(--yh-muted)]
                  prose-li:text-[15px] prose-li:leading-[1.8] prose-li:mb-1
                  prose-hr:border-[var(--yh-border)] prose-hr:my-10
                  prose-img:rounded-none prose-img:my-7 prose-img:shadow-md prose-img:border prose-img:border-[var(--yh-border)]
                  prose-table:text-[14px] prose-table:border-collapse prose-table:w-full prose-table:my-7 prose-table:rounded-none prose-table:shadow-sm prose-table:border prose-table:border-[var(--yh-border)]
                  prose-th:border-b-2 prose-th:border-[var(--yh-border)] prose-th:bg-[var(--dash-card)] prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold prose-th:text-[var(--yh-muted)] prose-th:text-[13px] prose-th:tracking-wide prose-th:uppercase
                  prose-td:border-b prose-td:border-[var(--yh-border)] prose-td:px-4 prose-td:py-3 prose-td:text-[var(--yh-muted)] prose-td:align-top
                  prose-thead:border-b-2 prose-thead:border-[var(--yh-border)]"
                  dangerouslySetInnerHTML={{ __html: post.html }}
                />
              )}

              {/* 底部标签：可点击进入标签聚合页 */}
              <div className="flex flex-wrap gap-2 mt-12 pt-6 border-t border-[var(--yh-border)]">
                {post.tags.map((tag) => (
                  <Link key={tag} href={`/tag/${encodeURIComponent(tag)}`} className={`text-xs px-3 py-1.5 rounded-none border transition-colors ${isDark ? "text-zinc-300 bg-[var(--dash-card)]/5 border-white/10 hover:bg-[var(--dash-card)]/15" : "text-[var(--yh-muted)] bg-[var(--dash-card)] border-[var(--yh-border)] hover:bg-white hover:text-[var(--yh-text)]"}`}>
                    #{tag}
                  </Link>
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

            {showTOC && <TableOfContents headings={post.headings} readMinutes={parseInt(post.readTime) || undefined} />}
          </div>
        </div>
      </section>

      {/* 继续阅读（v0.3 P1-6）：同分类优先的相关文章，最多 3 篇 */}
      {relatedPosts.length > 0 && (
        <section className="w-full max-w-[min(70%,1600px)] mx-auto px-6 pb-14">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1.5 h-5 rounded-none bg-gradient-to-b from-[var(--yh-accent)] to-[var(--yh-accent)]/50" />
            <h2 className="text-[13px] font-medium tracking-[0.2em] uppercase text-[var(--yh-muted)]">
              {lang === "zh" ? "继续阅读" : "Keep Reading"}
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[var(--yh-border)] to-transparent" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {relatedPosts.map((rp, idx) => (
              <Link
                key={rp.id}
                href={`/posts/${rp.id}`}
                className="group border border-[var(--yh-border)] bg-[var(--dash-card)] p-4 rounded-none hover:border-[var(--yh-muted)] hover:shadow-[var(--shadow-card)] transition-all duration-300 animate-[fadeInUp_0.5s_var(--ease-out)_both]"
                style={{ animationDelay: `${idx * 70}ms` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="mono text-[9px] tracking-[.14em] uppercase text-[var(--yh-muted)] border border-[var(--yh-border)] px-1.5 py-px">{rp.category}</span>
                  <span className="mono text-[10px] text-[var(--yh-muted)]">{formatDisplayDate(rp.date, lang)}</span>
                </div>
                <p className="text-[13px] font-medium leading-snug text-[var(--yh-text)] group-hover:text-[var(--yh-accent)] transition-colors line-clamp-2">
                  {lang === "zh" ? rp.titleZh || rp.title : rp.title}
                </p>
                <p className="text-[12px] text-[var(--yh-muted)] leading-relaxed line-clamp-2 mt-1.5">
                  {lang === "zh" ? rp.excerptZh || rp.excerpt : rp.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
