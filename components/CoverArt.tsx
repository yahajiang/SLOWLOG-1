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

/** 母题锚点：由构图模板决定，避免全站同一位置 */
type Zone = "right" | "left" | "br" | "bl" | "center";

const ZONE_CLASS: Record<Zone, string> = {
  right: "right-[12%] top-[22%]",
  left: "left-[10%] top-[24%]",
  br: "right-[12%] bottom-[22%]",
  bl: "left-[10%] bottom-[22%]",
  center: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-[55%]",
};

type MotifProps = {
  cat: string;
  ink: string;
  wash: string;
  accent: string;
  variant: number;
  variant4: number;
  zone: Zone;
};

function Motif({ cat, ink, wash, accent, variant, variant4, zone }: MotifProps) {
  const box = `absolute ${ZONE_CLASS[zone]}`;

  if (cat === "Design") {
    return (
      <div className={`${box} w-[34%] h-[42%]`}>
        <span className="absolute left-0 top-0 bottom-0 w-px" style={{ backgroundColor: ink, opacity: 0.2 }} />
        <span className="absolute right-[8%] top-[10%] w-[42%] aspect-square" style={{ backgroundColor: wash, opacity: 0.55 }} />
        <span
          className="absolute right-0 bottom-[12%] w-[32%] aspect-square cover-pulse"
          style={{ backgroundColor: accent, opacity: 0.35 }}
        />
        <span className="absolute left-3 top-2 w-8 h-px" style={{ backgroundColor: ink, opacity: 0.15 }} />
      </div>
    );
  }
  if (cat === "Plugin") {
    const solid = variant4 % 4;
    // 变体：方阵 / 单行三点 / 竖排
    const mode = variant % 3;
    if (mode === 0) {
      return (
        <div className={`${box} grid grid-cols-2 gap-[5px]`}>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="w-5 h-5 border"
              style={{
                borderColor: ink,
                backgroundColor: i === solid ? accent : i === 3 - solid ? wash : "transparent",
                opacity: 0.45,
              }}
            />
          ))}
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full cover-pulse"
            style={{ backgroundColor: accent, opacity: 0.6 }}
          />
        </div>
      );
    }
    if (mode === 1) {
      return (
        <div className={`${box} flex items-center gap-2`}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`${i === solid ? "w-3 h-3 cover-pulse" : "w-2 h-2"}`}
              style={{ backgroundColor: i === solid ? accent : wash, opacity: 0.55, borderRadius: i === 2 ? 0 : 999 }}
            />
          ))}
          <span className="w-10 h-px" style={{ backgroundColor: ink, opacity: 0.2 }} />
        </div>
      );
    }
    return (
      <div className={`${box} flex flex-col gap-1.5`}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-1.5"
            style={{
              width: 18 + i * 8,
              backgroundColor: i === solid ? accent : wash,
              opacity: i === solid ? 0.5 : 0.35,
            }}
          />
        ))}
      </div>
    );
  }
  if (cat === "Engineering") {
    return (
      <svg className={`${box} w-[40%] h-[38%]`} viewBox="0 0 160 80" aria-hidden>
        <path d="M8 52 L40 28 L78 44 L112 18 L152 34" fill="none" stroke={ink} strokeWidth="1.2" opacity="0.32" />
        <path className="cover-flow" d="M8 64 L48 56 L90 62 L152 48" fill="none" stroke={ink} strokeWidth="0.8" opacity="0.28" />
        <circle
          className="cover-pulse"
          cx={variant % 2 === 0 ? 78 : 112}
          cy={variant % 2 === 0 ? 44 : 18}
          r="3.5"
          fill={accent}
          opacity="0.75"
        />
        <rect x="12" y="12" width="22" height="14" fill="none" stroke={ink} strokeWidth="0.7" opacity="0.2" />
      </svg>
    );
  }
  if (cat === "Typography") {
    return (
      <div className={`${box} w-[36%]`}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="block h-px mb-3" style={{ backgroundColor: ink, opacity: 0.12 + i * 0.06 }} />
        ))}
        <span className="mono text-[10px]" style={{ color: ink, opacity: 0.35 }}>
          {12 + variant4 * 2}pt
        </span>
        <span className="absolute -right-2 top-1/2 w-2 h-2 rounded-full cover-pulse" style={{ backgroundColor: accent, opacity: 0.5 }} />
      </div>
    );
  }
  if (cat === "Frontend") {
    return (
      <div className={`${box} w-[38%] h-[36%] border`} style={{ borderColor: ink, opacity: 0.35 }}>
        <div className="flex items-center gap-1 px-2 h-3 border-b" style={{ borderColor: wash, backgroundColor: wash, opacity: 0.85 }}>
          <span className="w-1.5 h-1.5 rounded-full cover-pulse" style={{ backgroundColor: accent, opacity: 0.7 }} />
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ink, opacity: 0.22 }} />
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ink, opacity: 0.12 }} />
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
      <div className={`${box} flex gap-2`}>
        <span className="w-px self-stretch" style={{ backgroundColor: accent, opacity: 0.45 }} />
        <div className="space-y-2 pt-1">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span
                className={`w-1 h-1 rounded-full ${i === variant4 ? "cover-pulse" : ""}`}
                style={{ backgroundColor: i === variant4 ? accent : ink, opacity: 0.45 }}
              />
              <span className="block h-1" style={{ width: 22 + i * 8, backgroundColor: ink, opacity: 0.12 }} />
            </span>
          ))}
        </div>
      </div>
    );
  }
  // Life
  return (
    <div className={`${box} w-[32%] aspect-square`}>
      <span className="absolute inset-0 rounded-full border" style={{ borderColor: ink, opacity: 0.18 }} />
      <span className="absolute inset-[18%] rounded-full border" style={{ borderColor: accent, opacity: 0.35 }} />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full cover-pulse" style={{ backgroundColor: accent, opacity: 0.55 }} />
    </div>
  );
}

/** 无字母·对角几何（L2） */
function DiagonalFurnish({ ink, wash, accent, variant }: { ink: string; wash: string; accent: string; variant: number }) {
  return (
    <>
      <span
        className="absolute left-0 bottom-0 w-[55%] h-[38%]"
        style={{ background: `linear-gradient(135deg, transparent 40%, ${wash} 40%)`, opacity: 0.45 }}
      />
      <span className="absolute right-[18%] top-[28%] w-[22%] aspect-square" style={{ backgroundColor: wash, opacity: 0.4 }} />
      <span
        className="absolute right-[12%] top-[34%] w-[14%] aspect-square cover-pulse"
        style={{ backgroundColor: accent, opacity: variant % 2 ? 0.35 : 0.22 }}
      />
      <span className="absolute left-[22%] top-[22%] w-24 h-px rotate-[18deg]" style={{ backgroundColor: ink, opacity: 0.15 }} />
    </>
  );
}

export interface CoverArtProps {
  post: Post;
  ratio?: "wide" | "card";
  noBorder?: boolean;
  className?: string;
}

/**
 * 共享封面：5 套构图模板轮换 + 分类几何母题 + 底栏。
 * 字母刻意做小/可选，避免全站巨字刷屏。
 */
export const CoverArt = memo(function CoverArt({
  post,
  ratio = "card",
  noBorder = false,
  className = "",
}: CoverArtProps) {
  const rawCat = getCategoryName(post.category);
  const cat = (KNOWN as readonly string[]).includes(rawCat)
    ? rawCat
    : rawCat
      ? KNOWN[hashVariant(rawCat, KNOWN.length)]
      : "Design";
  const artCat = cat;
  const palette = { paper: "var(--ap)", ink: "var(--ai)", wash: "var(--aw)", accent: "var(--aa)" };

  const seed = (post.title || "") + cat + (post.id || "") + (post.tags?.join(",") || "");
  const variant = useMemo(() => hashVariant(seed, 8), [seed]);
  const variant4 = useMemo(() => hashVariant(seed + "4", 4), [seed]);
  const layout = useMemo(() => hashVariant(seed + "L", 5), [seed]);
  const initial = (post.title || "A").charAt(0);
  const abbr = (CAT_ABBR as any)[cat] || cat.slice(0, 3).toUpperCase();
  const noNum = useMemo(
    () => String(hashVariant(post.id || post.title || "0", 9000) + 1000).padStart(4, "0"),
    [post.id, post.title]
  );
  const tag = resolveTagPrimary((post as any).tags);
  const aspect = ratio === "wide" ? "aspect-[16/10]" : "aspect-[16/9]";
  const serifSize = ratio === "wide" ? "text-4xl" : "text-3xl";

  const motif = (
    <Motif
      cat={cat}
      ink={palette.ink}
      wash={palette.wash}
      accent={palette.accent}
      variant={variant}
      variant4={variant4}
      zone={layout === 0 ? "right" : layout === 1 ? "left" : layout === 3 ? "br" : layout === 4 ? "bl" : "right"}
    />
  );

  const letter = (
    <span
      className={`serif italic leading-none select-none font-light ${serifSize}`}
      style={{ color: palette.ink, opacity: 0.28 }}
    >
      {initial}
    </span>
  );

  return (
    <div
      aria-hidden="true"
      className={`group relative w-full overflow-hidden rounded-none ${aspect} cover cover-loop art-${artCat} ${noBorder ? "" : "border border-[var(--yh-border)]"} ${className}`}
      style={{ backgroundColor: palette.paper }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 4px, ${palette.wash} 4px, ${palette.wash} 5px)`,
          opacity: 0.05,
        }}
      />
      <div className="absolute top-0 left-5 right-5 h-px" style={{ backgroundColor: palette.ink, opacity: 0.06 }} />
      <span className="absolute top-3 right-4 w-1 h-1 cover-pulse" style={{ backgroundColor: palette.accent, opacity: 0.55 }} />

      <div className="absolute inset-0 cover-inner">
        {layout === 0 && (
          <>
            <div className="absolute left-[12%] top-[18%]">{letter}</div>
            {motif}
          </>
        )}
        {layout === 1 && (
          <>
            {motif}
            <div className="absolute right-[12%] bottom-[24%] mono text-[11px] tracking-[0.2em]" style={{ color: palette.ink, opacity: 0.35 }}>
              {initial.toUpperCase()}
            </div>
          </>
        )}
        {layout === 2 && <DiagonalFurnish ink={palette.ink} wash={palette.wash} accent={palette.accent} variant={variant} />}
        {layout === 3 && (
          <>
            <div className="absolute inset-x-0 top-0 h-[34%]" style={{ backgroundColor: palette.wash, opacity: 0.35 }} />
            <div className="absolute left-5 top-[12%]">{letter}</div>
            {motif}
          </>
        )}
        {layout === 4 && (
          <>
            <div
              className="absolute inset-4 border pointer-events-none"
              style={{ borderColor: palette.ink, opacity: 0.1 }}
            />
            <div className="absolute right-5 top-4 mono text-[10px] tracking-[0.18em]" style={{ color: palette.ink, opacity: 0.3 }}>
              {initial.toUpperCase()}·{noNum.slice(-2)}
            </div>
            {motif}
          </>
        )}
      </div>

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
