"use client";

import { CoverArt } from "@/components/CoverArt";
import type { Post } from "@/lib/types";

/**
 * 文章卡片封面：CoverArt card（16/9）封装。
 * `tall` 兼容保留：true 时用 Hero 比例；列表卡路径不传。
 */
export function ArticleArt({
  post,
  tall = false,
  noBorder = false,
}: {
  post: Post;
  tall?: boolean;
  noBorder?: boolean;
}) {
  return <CoverArt post={post} ratio={tall ? "wide" : "card"} noBorder={noBorder} />;
}
