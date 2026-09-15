"use client";

import { memo } from "react";
import { useLang } from "@/lib/lang-context";
import { catLabel } from "@/components/HomeClient";

export const CategoryBadge = memo(function CategoryBadge({
  category,
}: {
  category: string;
}) {
  const { t } = useLang();
  return (
    <span
      className={`art-${category} inline-block px-2.5 py-0.5 text-[10px] font-semibold tracking-widest uppercase rounded-none border`}
      style={{
        backgroundColor: "var(--ap)", color: "var(--ai)", borderColor: "var(--aw)",
      }}
    >
      {catLabel(category, t)}
    </span>
  );
});
