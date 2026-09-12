"use client";

import { CoverArt } from "@/components/CoverArt";
import type { Post } from "@/lib/types";

/** 推荐位 Hero 封面：CoverArt wide 封装 */
export function HeroCover({
  post,
  noBorder = false,
  className = "",
}: {
  post: Post;
  noBorder?: boolean;
  className?: string;
}) {
  return <CoverArt post={post} ratio="wide" noBorder={noBorder} className={className} />;
}
