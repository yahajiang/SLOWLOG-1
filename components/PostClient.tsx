"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang-context";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { CategoryBadge } from "./CategoryBadge";
import { AuthorAvatar } from "./AuthorAvatar";
import { ReadingProgress } from "./ReadingProgress";
import { TableOfContents } from "./TableOfContents";
import { Footer } from "./Footer";
import { useRelativeTime } from "@/lib/relative-time";
import type { Post } from "@/lib/posts";

export function PostClient({
  post: rawPost,
  prevPost,
  nextPost,
}: {
  post: Post;
  prevPost: Post | null;
  nextPost: Post | null;
}) {
  const { t, lang } = useLang();
  const relative = useRelativeTime(rawPost.createdAt || rawPost.date, lang);
  const post = lang === "zh"
    ? { ...rawPost, title: rawPost.titleZh || rawPost.title, excerpt: rawPost.excerptZh || rawPost.excerpt, html: rawPost.htmlZh || rawPost.html, headings: rawPost.headingsZh || rawPost.headings }
    : rawPost;

  return (
    <div className="min-h-screen">
      <ReadingProgress />

      <div className="sticky top-0 z-40 bg-[var(--yh-bg)]/80 backdrop-blur-xl border-b border-[var(--yh-border)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight hover:opacity-60 transition-opacity"
          >
            {t.siteName}
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/"
              className="text-xs tracking-widest uppercase text-[var(--yh-muted)] hover:text-[var(--yh-text)] transition-colors border border-zinc-200 px-3 py-1.5 bg-white"
            >
              {t.backToPosts}
            </Link>
          </div>
        </div>
      </div>

      <section className="pt-10 pb-8 md:pt-14">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex items-center gap-3 mb-4">
            <CategoryBadge category={post.category} />
            <span className="text-[var(--yh-border)]">/</span>
            <span className="text-[11px] text-[var(--yh-muted)]">
              {post.readTime}
            </span>
          </div>
          <h1 className="text-3xl md:text-[2.5rem] font-semibold leading-[1.2] tracking-tight text-[var(--yh-text)] mb-4">
            {post.title}
          </h1>
          <p className="text-[15px] leading-relaxed text-[var(--yh-muted)] mb-6">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-3 pb-6 border-b border-[var(--yh-border)]">
            <AuthorAvatar initial={post.authorInitial} size="lg" />
            <div>
              <p className="text-sm font-semibold text-zinc-800">
                {post.author}
              </p>
              <p className="text-xs text-zinc-400">
                {relative} · {post.category}
              </p>
            </div>
            <div className="ml-auto hidden sm:flex gap-1.5">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] text-zinc-500 bg-zinc-50 border border-zinc-200 px-2 py-1 rounded-sm"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex gap-12">
            <article className="flex-1 max-w-3xl min-w-0">
              <div
                className="prose prose-zinc max-w-none
                  prose-p:text-[16px] prose-p:leading-[1.9] prose-p:text-[var(--yh-text)]/85 prose-p:mb-6 prose-p:font-light
                  prose-h1:text-3xl prose-h1:font-bold prose-h1:mt-12 prose-h1:mb-4 prose-h1:tracking-tight
                  prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-12 prose-h2:mb-3 prose-h2:scroll-mt-24 prose-h2:tracking-tight prose-h2:border-b prose-h2:border-zinc-100 prose-h2:pb-2
                  prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-2
                  prose-h4:text-base prose-h4:font-semibold prose-h4:mt-6 prose-h4:mb-2
                  prose-a:text-[var(--yh-accent)] prose-a:underline prose-a:underline-offset-4 prose-a:decoration-2 prose-a:hover:decoration-[var(--yh-accent)]
                  prose-strong:font-semibold prose-strong:text-zinc-900
                  prose-code:text-[13px] prose-code:bg-zinc-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-rose-600 prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:p-5 prose-pre:rounded-xl prose-pre:overflow-x-auto prose-pre:border prose-pre:border-zinc-800 prose-pre:shadow-lg
                  prose-blockquote:border-l-[3px] prose-blockquote:border-[var(--yh-accent)]/30 prose-blockquote:pl-5 prose-blockquote:text-zinc-600 prose-blockquote:italic prose-blockquote:bg-zinc-50/50 prose-blockquote:py-1 prose-blockquote:pr-4 prose-blockquote:rounded-r-lg
                  prose-ul:list-disc prose-ul:pl-6 prose-ul:marker:text-zinc-400 prose-ol:list-decimal prose-ol:pl-6 prose-ol:marker:text-zinc-400
                  prose-li:text-[15px] prose-li:leading-[1.8] prose-li:mb-1
                  prose-hr:border-zinc-200 prose-hr:my-12
                  prose-img:rounded-xl prose-img:my-8 prose-img:shadow-md prose-img:border prose-img:border-zinc-100
                  prose-table:text-[14px] prose-table:border-collapse prose-table:w-full prose-table:my-8 prose-table:rounded-lg prose-table:overflow-hidden prose-table:shadow-sm prose-table:border prose-table:border-zinc-200
                  prose-th:border-b-2 prose-th:border-zinc-200 prose-th:bg-zinc-50 prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold prose-th:text-zinc-700 prose-th:text-[13px] prose-th:tracking-wide prose-th:uppercase
                  prose-td:border-b prose-td:border-zinc-100 prose-td:px-4 prose-td:py-3 prose-td:text-zinc-600 prose-td:align-top
                  prose-thead:border-b-2 prose-thead:border-zinc-200"
                dangerouslySetInnerHTML={{ __html: post.html }}
              />

              <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-[var(--yh-border)]">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-zinc-500 bg-white border border-zinc-200 px-3 py-1.5 rounded-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </article>

            <TableOfContents headings={post.headings} />
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--yh-border)] py-10 bg-white/40">
        <div className="mx-auto max-w-3xl px-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              {prevPost ? (
                <Link
                  href={`/posts/${prevPost.id}`}
                  className="group block border border-zinc-200 bg-white p-4 hover:border-zinc-400 transition-colors"
                >
                  <p className="text-[10px] tracking-widest uppercase text-zinc-400 mb-1">
                    {t.previous}
                  </p>
                  <p className="text-sm font-medium text-zinc-900 group-hover:text-[var(--yh-accent)] transition-colors line-clamp-2">
                    {prevPost.title}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {prevPost.displayDate}
                  </p>
                </Link>
              ) : (
                <div className="p-4 text-xs text-zinc-400">{t.noPrevious}</div>
              )}
            </div>
            <div>
              {nextPost ? (
                <Link
                  href={`/posts/${nextPost.id}`}
                  className="group block border border-zinc-200 bg-white p-4 hover:border-zinc-400 transition-colors text-right"
                >
                  <p className="text-[10px] tracking-widest uppercase text-zinc-400 mb-1">
                    {t.next}
                  </p>
                  <p className="text-sm font-medium text-zinc-900 group-hover:text-[var(--yh-accent)] transition-colors line-clamp-2">
                    {nextPost.title}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {nextPost.displayDate}
                  </p>
                </Link>
              ) : (
                <div className="p-4 text-xs text-zinc-400 text-right">
                  {t.noNext}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
