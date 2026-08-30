import { memo } from "react";
import { CATEGORY_COLORS } from "@/lib/categories";
import type { ContentCategory } from "@/lib/categories";

export const CategoryBadge = memo(function CategoryBadge({
  category,
}: {
  category: ContentCategory;
}) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-[10px] font-semibold tracking-widest uppercase rounded-sm ${CATEGORY_COLORS[category]}`}
    >
      {category}
    </span>
  );
});
