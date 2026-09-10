"use client";

import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { ArticleArt } from "./ArticleArt";
import { CategoryBadge } from "./CategoryBadge";
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
      className={`group text-left w-full border border-[var(--yh-border)] bg-[var(--dash-card)] hover:shadow-[var(--shadow-float)] hover:-translate-y-[2px] flex flex-col overflow-hidden rounded-none transition-[transform,box-shadow] duration-300 [transition-timing-function:var(--ease-spring)] transform-gpu [backface-visibility:hidden] animate-[pageIn_0.5s_var(--ease-out)_both]`}
      style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
    >
      <div className="relative overflow-hidden aspect-[16/9]">
        <div className="h-full w-full transition-transform duration-500 [transition-timing-function:var(--ease-out)] group-hover:scale-[1.04]">
          <ArticleArt post={post} />
        </div>
        <div className="absolute top-2.5 left-2.5">
          <CategoryBadge category={post.category} />
        </div>
      </div>
      <div className="p-3 pt-2.5 flex flex-col gap-1.5 flex-1">
        <h3 className="text-[13px] font-semibold leading-snug text-[var(--yh-text)] group-hover:text-[var(--yh-accent)] transition-colors duration-200 line-clamp-2">
          {post.title}
        </h3>
        <p className="text-[12px] text-[var(--yh-muted)] leading-relaxed line-clamp-2">
          {post.excerpt}
        </p>

        {post.tags[0] && (
          <span className="mono text-[10px] tracking-[0.12em] text-[var(--yh-muted)]/70 truncate max-w-[120px]">
            {post.tags[0]}
          </span>
        )}

        <div className="flex items-center gap-2 pt-2 mt-auto border-t border-[var(--yh-border)]/60">
          <p className="text-[11px] text-[var(--yh-muted)] truncate flex-1 min-w-0">
            {relative} · {post.readTime}
          </p>
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
            <ChevronRight className="w-4 h-4 text-[var(--yh-border)] group-hover:text-[var(--yh-accent)] group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
          )}
        </div>
      </div>
    </Link>
  );
}
