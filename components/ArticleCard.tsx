"use client";

import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { ArticleArt } from "./ArticleArt";
import { CategoryBadge } from "./CategoryBadge";
import { AuthorAvatar } from "./AuthorAvatar";
import type { Post } from "@/lib/types";
import { useLang } from "@/lib/lang-context";
import { useRelativeTime } from "@/lib/relative-time";

const REPO_MAP: Record<string, string> = {
  "soulsync-emotion-engine-architecture": "https://github.com/yahajiang/astrbot_plugin_soulsync",
  "tauri-react-print-assistant": "https://github.com/yahajiang/print-assistant",
  "soulsync-bistro-emotion-food": "https://github.com/yahajiang/astrbot_plugin_soulsync/tree/soulsync-bistro",
  "soulsync-mirror-self-exploration": "https://github.com/yahajiang/astrbot_plugin_soulsync/tree/soulsync_mirror",
  "soulsync-shield-prompt-injection": "https://github.com/yahajiang/astrbot_plugin_soulsync/tree/soulsync-shield",
  "soulsync-menu-image-generator": "https://github.com/yahajiang/astrbot_plugin_soulsync/tree/soulsync-menu",
};

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
      className={`group text-left w-full border border-[var(--yh-border)] bg-[var(--dash-card)] hover:shadow-[var(--shadow-float)] hover:-translate-y-[2px] flex flex-col overflow-hidden rounded-none transition-[transform,box-shadow] duration-300 [transition-timing-function:var(--ease-spring)] transform-gpu [backface-visibility:hidden] will-change-transform animate-[slideInUp_0.5s_var(--ease-out)_both] [animation-delay:${index * 50}ms]`}
    >
      <div className="relative overflow-hidden aspect-[16/9]">
        <ArticleArt post={post} />
        <div className="absolute top-2.5 left-2.5">
          <CategoryBadge category={post.category} />
        </div>
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="text-[13px] font-semibold leading-snug text-zinc-900 group-hover:text-[var(--yh-accent)] transition-colors duration-200 line-clamp-2">
          {post.title}
        </h3>
        <p className="text-[12px] text-[var(--yh-muted)] leading-relaxed line-clamp-2">
          {post.excerpt}
        </p>

        <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
          {post.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="mono text-[11px] tracking-[0.14em] text-[var(--yh-muted)] bg-[var(--dash-card)] border border-[var(--yh-border)] px-1.5 py-0.5 rounded-none truncate max-w-[80px]"
            >
              {tag}
            </span>
          ))}
          {post.tags.length > 2 && <span className="mono text-[11px] tracking-[0.14em] text-[var(--yh-muted)] px-1 py-0.5">+{post.tags.length - 2}</span>}
        </div>

        <div className="flex items-center gap-2 pt-2.5 border-t border-[var(--yh-border)]/80">
          <AuthorAvatar initial={post.authorInitial} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-[var(--yh-muted)] truncate">
              {relative} · {post.readTime}
            </p>
          </div>
          {REPO_MAP[post.id] ? (
            <a
              href={REPO_MAP[post.id]}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] text-[var(--yh-muted)] hover:text-[var(--yh-accent)] transition-colors flex items-center gap-0.5 shrink-0"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[var(--yh-accent)] group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
          )}
        </div>
      </div>
    </Link>
  );
}
