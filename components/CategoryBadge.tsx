import { memo } from "react";
import { ART_PALETTES } from "@/lib/categories";
import { useLang } from "@/lib/lang-context";
import { catLabel } from "@/components/HomeClient";

export const CategoryBadge = memo(function CategoryBadge({
  category,
}: {
  category: string;
}) {
  const { t } = useLang();
  const palette = (ART_PALETTES as any)[category];
  return (
    <span
      className="inline-block px-2.5 py-0.5 text-[10px] font-semibold tracking-widest uppercase rounded-none border"
      style={
        palette
          ? { backgroundColor: palette.paper, color: palette.ink, borderColor: palette.wash }
          : { backgroundColor: "#F8F7F4", color: "#6b7280", borderColor: "#e5e7eb" }
      }
    >
      {catLabel(category, t)}
    </span>
  );
});
