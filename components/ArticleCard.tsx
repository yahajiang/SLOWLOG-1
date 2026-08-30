"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ArticleArt } from "./ArticleArt";
import { CategoryBadge } from "./CategoryBadge";
import { AuthorAvatar } from "./AuthorAvatar";
import type { Post } from "@/lib/posts";
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
  const relative = useRelativeTime(post.date, lang);
  return (
    <Link
      href={`/posts/${post.id}`}
      className="group text-left w-full border border-zinc-200/80 bg-white hover:border-zinc-300 transition-all duration-400 flex flex-col hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] hover:-translate-y-1"
      style={{
        animation: `slideInUp 0.5s var(--ease-out) both`,
        animationDelay: `${index * 60}ms`,
        transitionTimingFunction: "var(--ease-spring)",
      }}
    >
      <ArticleArt post={post} />
      <div className="p-6 flex flex-col gap-4 flex-1">
        <div className="flex items-center justify-between">
          <CategoryBadge category={post.category} />
          <span className="text-[10px] text-zinc-400 tracking-wide">
            {post.readTime}
          </span>
        </div>

        <div>
          <h3 className="text-[17px] font-semibold leading-snug text-zinc-900 mb-2.5 group-hover:text-[var(--yh-accent)] transition-colors duration-300">
            {post.title}
          </h3>
          <p className="text-[14px] text-zinc-500 leading-relaxed line-clamp-2">
            {post.excerpt}
          </p>
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100/80">
          <div className="flex items-center gap-2.5">
            <AuthorAvatar initial={post.authorInitial} />
            <div>
              <p className="text-[12px] font-medium text-zinc-700">
                {post.author}
              </p>
              <p className="text-[11px] text-zinc-400">{relative} · {post.readTime}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[var(--yh-accent)] group-hover:translate-x-1 transition-all duration-300" />
        </div>

        <div className="flex flex-wrap gap-2">
          {post.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[11px] text-zinc-400 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-sm tracking-wide group-hover:bg-zinc-100 transition-colors duration-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
