"use client";

import { memo, useMemo } from "react";
import { CAT_ABBR, resolveTagPrimary } from "@/lib/categories";
import type { Post } from "@/lib/types";

function hashVariant(seed: string, max: number): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h) % max;
}

function getCategoryName(category: any): string {
  if (typeof category === "string") return category;
  if (category && typeof category === "object") return category.name || category.nameZh || "";
  return "";
}

const KNOWN = ["Design", "Plugin", "Engineering", "Typography", "Frontend", "Snippet", "Life"] as const;

type MotifProps = { ink: string; wash: string; accent: string; variant: number; variant4: number };

/** 分类几何母题：大字旁的点缀，不进中心安全区之外的底栏 */
function Motif({ cat, ink, wash, accent, variant, variant4 }: MotifProps & { cat: string }) {
  if (cat === "Design") {
    return (
      <>
        <span className="absolute left-[18%] top-[14%] bottom-[28%] w-px" style={{ backgroundColor: ink, opacity: 0.18 }} />
        <span className="absolute right-[14%] top-[22%] w-[18%] aspect-square" style={{ backgroundColor: wash, opacity: 0.55 }} />
        <span
          className="absolute right-[10%] top-[28%] w-[14%] aspect-square"
          style={{ backgroundColor: accent, opacity: variant % 2 === 0 ? 0.35 : 0.22 }}
        />
      </>
    );
  }
  if (cat === "Plugin") {
    const solid = variant4 % 4;
    return (
        <div className="absolute right-[12%] top-[20%] grid grid-cols-2 gap-[6px]">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="w-6 h-6 border"
              style={{
                borderColor: ink,
                backgroundColor: i === solid ? accent : i === 3 - solid ? wash : "transparent",
                opacity: 0.45,
              }}
            />
          ))}
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent, opacity: 0.55 }} />
        </div>
    );
  }
  if (cat === "Engineering") {
    return (
      <svg className="absolute right-[8%] top-[16%] w-[42%] h-[36%]" viewBox="0 0 160 80" aria-hidden>
        <path d="M8 52 L40 28 L78 44 L112 18 L152 34" fill="none" stroke={ink} strokeWidth="1.2" opacity="0.35" />
        <path d="M8 64 L48 56 L90 62 L152 48" fill="none" stroke={ink} strokeWidth="0.8" strokeDasharray="4 3" opacity="0.25" />
        <circle cx={variant % 2 === 0 ? 78 : 112} cy={variant % 2 === 0 ? 44 : 18} r="3.5" fill={accent} opacity="0.7" />
      </svg>
    );
  }
  if (cat === "Typography") {
    return (
      <>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute left-[12%] right-[18%] h-px"
            style={{ top: `${28 + i * 12}%`, backgroundColor: ink, opacity: 0.14 + i * 0.06 }}
          />
        ))}
        <span className="absolute right-[14%] top-[24%] mono text-[10px]" style={{ color: ink, opacity: 0.35 }}>
          {12 + variant4 * 2}pt
        </span>
      </>
    );
  }
  if (cat === "Frontend") {
    return (
      <div className="absolute right-[12%] top-[20%] w-[36%] h-[34%] border" style={{ borderColor: ink, opacity: 0.35 }}>
        <div className="flex items-center gap-1 px-2 h-3 border-b" style={{ borderColor: wash, backgroundColor: wash, opacity: 0.8 }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent, opacity: 0.7 }} />
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ink, opacity: 0.25 }} />
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ink, opacity: 0.15 }} />
        </div>
        <div className="p-2 space-y-1.5">
          <span className="block h-1 w-3/4" style={{ backgroundColor: ink, opacity: 0.12 }} />
          <span className="block h-1 w-1/2" style={{ backgroundColor: wash }} />
        </div>
      </div>
    );
  }
  if (cat === "Snippet") {
    return (
      <div className="absolute right-[14%] top-[22%] flex gap-2">
        <span className="w-px self-stretch" style={{ backgroundColor: accent, opacity: 0.45 }} />
        <div className="space-y-2 pt-1">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: i === variant4 ? accent : ink, opacity: 0.4 }} />
              <span className="block h-1" style={{ width: 28 + i * 10, backgroundColor: ink, opacity: 0.12 }} />
            </span>
          ))}
        </div>
      </div>
    );
  }
  // Life
  return (
    <>
      <span
        className="absolute right-[16%] top-[18%] w-[28%] aspect-square rounded-full border"
        style={{ borderColor: ink, opacity: 0.2 }}
      />
      <span
        className="absolute right-[20%] top-[24%] w-[18%] aspect-square rounded-full border"
        style={{ borderColor: accent, opacity: 0.45 }}
      />
      <span className="absolute right-[24%] top-[30%] w-2 h-2 rounded-full" style={{ backgroundColor: accent, opacity: 0.55 }} />
    </>
  );
}

/**
 * 推荐位 Hero 封面：大衬线首字母 + 分类几何母题 + 底栏编号。
 * 不用 TagScene / PluginSymbol，专供首页 Hero 侧栏（tall 语义）。
 */
export const HeroCover = memo(function HeroCover({
  post,
  noBorder = false,
  className = "",
}: {
  post: Post;
  noBorder?: boolean;
  className?: string;
}) {
  const rawCat = getCategoryName(post.category);
  const cat = (KNOWN as readonly string[]).includes(rawCat) ? rawCat : rawCat ? KNOWN[hashVariant(rawCat, KNOWN.length)] : "Design";
  const artCat = cat || "Generic";
  const palette = { paper: "var(--ap)", ink: "var(--ai)", wash: "var(--aw)", accent: "var(--aa)" };

  const seed = (post.title || "") + cat + (post.id || "") + (post.tags?.join(",") || "");
  const variant = useMemo(() => hashVariant(seed, 8), [seed]);
  const variant4 = useMemo(() => hashVariant(seed + "4", 4), [seed]);
  const initial = (post.title || "A").charAt(0);
  const abbr = (CAT_ABBR as any)[cat] || cat.slice(0, 3).toUpperCase();
  const noNum = useMemo(() => String(hashVariant(post.id || post.title || "0", 9000) + 1000).padStart(4, "0"), [post.id, post.title]);
  const tag = resolveTagPrimary((post as any).tags);

  return (
    <div
      aria-hidden="true"
      className={`group relative w-full overflow-hidden rounded-none aspect-[16/10] cover art-${artCat} ${noBorder ? "" : "border border-[var(--yh-border)]"} ${className}`}
      style={{ backgroundColor: palette.paper }}
    >
      {/* 轻纸纹 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 4px, ${palette.wash} 4px, ${palette.wash} 5px)`,
          opacity: 0.06,
        }}
      />
      {/* 顶发丝 */}
      <div className="absolute top-0 left-5 right-5 h-px" style={{ backgroundColor: palette.ink, opacity: 0.06 }} />

      {/* 分类几何母题 */}
      <Motif cat={cat} ink={palette.ink} wash={palette.wash} accent={palette.accent} variant={variant} variant4={variant4} />

      {/* 巨衬线首字母：左侧安全区内 */}
      <span
        className="absolute serif italic leading-none select-none font-light tracking-tighter left-[12%] top-[20%] text-[6.5rem]"
        style={{ color: palette.ink, opacity: 0.32 }}
      >
        {initial}
      </span>

      {/* 底栏一行 */}
      <span className="absolute bottom-6 left-5 right-5 h-px" style={{ backgroundColor: palette.ink, opacity: 0.12 }} />
      <span
        className="absolute bottom-2 left-5 right-5 mono text-[9px] tracking-[0.14em] select-none"
        style={{ color: palette.ink, opacity: 0.38, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
      >
        {`${abbr} · ${noNum}${tag ? ` · ${String(tag).replace(/[[\]]/g, "").toUpperCase()}` : ""}`}
      </span>
    </div>
  );
});
