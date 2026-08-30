"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ArticleArt } from "./ArticleArt";
import { CategoryBadge } from "./CategoryBadge";
import { AuthorAvatar } from "./AuthorAvatar";
import type { Post } from "@/lib/types";
import { useLang } from "@/lib/lang-context";
import { useRelativeTime } from "@/lib/relative-time";

export function ArticleCard({
  post,
  index = 0,
}: {
  post: Post;
  index?: number;
}) {
  const { lang } = useLang();
  const relative = useRelativeTime(post.createdAt || post.date, lang);
  return (
    <Link
      href={`/posts/${post.id}`}
      className="group text-left w-full border border-zinc-200/60 bg-white hover:border-zinc-300 transition-all duration-300 flex flex-col hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1 overflow-hidden"
      style={{
        animation: `slideInUp 0.5s var(--ease-out) both`,
        animationDelay: `${index * 50}ms`,
        transitionTimingFunction: "var(--ease-spring)",
      }}
    >
      <div className="relative overflow-hidden aspect-[16/10]">
        <ArticleArt post={post} />
        <div className="absolute top-3 left-3">
          <CategoryBadge category={post.category} />
        </div>
      </div>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <h3 className="text-[16px] font-semibold leading-snug text-zinc-900 group-hover:text-[var(--yh-accent)] transition-colors duration-200 line-clamp-2">
          {post.title}
        </h3>
        <p className="text-[13.5px] text-zinc-500 leading-relaxed line-clamp-2">
          {post.excerpt}
        </p>

        <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
          {post.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-zinc-400 bg-zinc-50 border border-zinc-100 px-1.5 py-0.5 rounded-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2.5 pt-3 border-t border-zinc-100/80">
          <AuthorAvatar initial={post.authorInitial} />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-zinc-400 truncate">
              {relative} · {post.readTime}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[var(--yh-accent)] group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
        </div>
      </div>
    </Link>
  );
}
