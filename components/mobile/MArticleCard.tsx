"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ArticleArt } from "@/components/ArticleArt";
import { CategoryBadge } from "@/components/CategoryBadge";
import { AuthorAvatar } from "@/components/AuthorAvatar";
import { useLang } from "@/lib/lang-context";
import { useRelativeTime } from "@/lib/relative-time";

/** 移动端文章卡：全宽单列，封面 + 徽标 + 标题摘要 + 标签 + 元信息（桌面风格同源） */
export function MArticleCard({ post }: { post: any }) {
  const { lang } = useLang();
  const relative = useRelativeTime(post.createdAt || post.date, lang);
  const title = lang === "zh" ? post.titleZh || post.title : post.title;
  const excerpt = lang === "zh" ? post.excerptZh || post.excerpt : post.excerpt;

  return (
    <Link
      href={`/m/posts/${post.id}`}
      className="group text-left w-full border border-[var(--yh-border)] bg-[var(--dash-card)] active:bg-zinc-50 flex flex-col overflow-hidden rounded-none"
    >
      <div className="relative overflow-hidden aspect-[16/9]">
        <ArticleArt post={post} />
        <div className="absolute top-2.5 left-2.5">
          <CategoryBadge category={post.category} />
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="text-[15px] font-semibold leading-snug text-zinc-900 line-clamp-2">
          {title}
        </h3>
        <p className="text-[13px] text-[var(--yh-muted)] leading-relaxed line-clamp-2">
          {excerpt}
        </p>
        {(post.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {post.tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="mono text-[10px] tracking-[0.14em] text-[var(--yh-muted)] bg-[var(--dash-card)] border border-[var(--yh-border)] px-1.5 py-0.5 rounded-none truncate max-w-[100px]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 pt-2.5 border-t border-[var(--yh-border)]/80">
          <AuthorAvatar initial={post.authorInitial} />
          <p className="text-[11px] text-[var(--yh-muted)] truncate flex-1 min-w-0">
            {relative} · {post.readTime}
          </p>
          <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0" />
        </div>
      </div>
    </Link>
  );
}
