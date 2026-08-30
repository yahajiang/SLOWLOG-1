"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang-context";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { CategoryBadge } from "./CategoryBadge";
import { AuthorAvatar } from "./AuthorAvatar";
import { ReadingProgress } from "./ReadingProgress";
import { TableOfContents } from "./TableOfContents";
import { Footer } from "./Footer";
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
                {post.displayDate} · {post.category}
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
                  prose-p:text-[15px] prose-p:leading-[1.85] prose-p:text-[var(--yh-text)]/85 prose-p:mb-6 prose-p:font-light
                  prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-3 prose-h2:scroll-mt-24 prose-h2:flex prose-h2:items-center prose-h2:gap-3
                  prose-a:text-[var(--yh-accent)] prose-a:underline prose-a:underline-offset-4
                  prose-code:text-[13px] prose-code:bg-zinc-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono
                  prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                  prose-blockquote:border-l-2 prose-blockquote:border-[var(--yh-border)] prose-blockquote:pl-4 prose-blockquote:text-zinc-600 prose-blockquote:italic
                  prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6
                  prose-hr:border-[var(--yh-border)]"
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
