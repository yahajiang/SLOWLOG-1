"use client";

import { memo, useMemo } from "react";
import { CAT_ABBR, resolveTagPrimary, resolveTagSymbol } from "@/lib/categories";
import type { TagSymbol } from "@/lib/categories";
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

type Zone = "right" | "left" | "br" | "bl" | "center";
const ZONE_CLASS: Record<Zone, string> = {
  right: "right-[12%] top-[22%]",
  left: "left-[10%] top-[24%]",
  br: "right-[12%] bottom-[22%]",
  bl: "left-[10%] bottom-[22%]",
  center: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-[55%]",
};

type Pal = { ink: string; wash: string; accent: string };

/** 8 族标签符号：个性几何，分类无关 */
function SymbolArt({
  symbol,
  pal,
  variant,
  variant4,
}: {
  symbol: TagSymbol;
  pal: Pal;
  variant: number;
  variant4: number;
}) {
  const { ink, wash, accent } = pal;
  if (symbol === "grid") {
    const solid = variant4 % 4;
    return (
      <div className="relative grid grid-cols-2 gap-[5px]">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="w-5 h-5 border"
            style={{
              borderColor: ink,
              backgroundColor: i === solid ? accent : i === 3 - solid ? wash : "transparent",
              opacity: 0.48,
            }}
          />
        ))}
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full cover-pulse"
          style={{ backgroundColor: accent, opacity: 0.65 }}
        />
      </div>
    );
  }
  if (symbol === "shield") {
    return (
      <svg className="w-12 h-14" viewBox="0 0 48 56" aria-hidden>
        <path
          d="M24 4 L42 12 V28 Q42 42 24 52 Q6 42 6 28 V12 Z"
          fill={wash}
          stroke={ink}
          strokeWidth="1.2"
          opacity="0.55"
        />
        <path d="M24 16 V34" stroke={accent} strokeWidth="1.5" opacity="0.7" />
        <circle className="cover-pulse" cx="24" cy="24" r="3" fill={accent} opacity="0.8" />
      </svg>
    );
  }
  if (symbol === "doubleCircle") {
    return (
      <div className="relative w-14 h-14">
        <span className="absolute left-0 top-2 w-10 h-10 rounded-full border" style={{ borderColor: ink, opacity: 0.35 }} />
        <span className="absolute right-0 bottom-0 w-10 h-10 rounded-full border" style={{ borderColor: wash, backgroundColor: wash, opacity: 0.45 }} />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full cover-pulse" style={{ backgroundColor: accent, opacity: 0.7 }} />
      </div>
    );
  }
  if (symbol === "wave") {
    return (
      <svg className="w-16 h-12" viewBox="0 0 64 48" aria-hidden>
        <path d="M4 28 Q16 12 32 28 T60 28" fill="none" stroke={ink} strokeWidth="1.3" opacity="0.4" />
        <path className="cover-flow" d="M4 36 Q16 22 32 36 T60 36" fill="none" stroke={accent} strokeWidth="1" opacity="0.55" />
        <circle className="cover-pulse" cx="32" cy="18" r="2.5" fill={accent} opacity="0.7" />
      </svg>
    );
  }
  if (symbol === "diamond") {
    return (
      <svg className="w-14 h-14" viewBox="0 0 56 56" aria-hidden>
        <polygon points="28,6 50,28 28,50 6,28" fill="none" stroke={ink} strokeWidth="1.2" opacity="0.4" />
        <polygon points="28,16 40,28 28,40 16,28" fill={wash} opacity="0.5" />
        <circle className="cover-pulse" cx="28" cy="28" r="3" fill={accent} opacity="0.75" />
      </svg>
    );
  }
  if (symbol === "window") {
    return (
      <div className="w-16 h-12 border" style={{ borderColor: ink, opacity: 0.4 }}>
        <div className="flex items-center gap-1 px-1.5 h-3 border-b" style={{ borderColor: wash, backgroundColor: wash }}>
          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: accent, opacity: 0.8 }} />
          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: ink, opacity: 0.25 }} />
        </div>
        <div className="p-1.5 space-y-1">
          <span className="block h-1 w-3/4" style={{ backgroundColor: ink, opacity: 0.12 }} />
          <span className="block h-1 w-1/2" style={{ backgroundColor: wash }} />
        </div>
      </div>
    );
  }
  if (symbol === "hex") {
    return (
      <svg className="w-14 h-14" viewBox="0 0 56 56" aria-hidden>
        <polygon
          points="28,4 50,16 50,40 28,52 6,40 6,16"
          fill="none"
          stroke={ink}
          strokeWidth="1.2"
          opacity="0.4"
        />
        <line x1="28" y1="18" x2="18" y2="28" stroke={ink} strokeWidth="0.8" opacity="0.3" />
        <line x1="28" y1="18" x2="38" y2="28" stroke={ink} strokeWidth="0.8" opacity="0.3" />
        <circle className="cover-pulse" cx="28" cy="30" r="3" fill={accent} opacity="0.75" />
      </svg>
    );
  }
  // circle — 环数/虚线/点位随 variant
  const rings = 1 + (variant % 3);
  const dashed = variant4 % 2 === 0;
  return (
    <svg className="w-14 h-14" viewBox="0 0 56 56" aria-hidden>
      <circle cx="28" cy="28" r="20" fill="none" stroke={ink} strokeWidth="1" opacity="0.25" strokeDasharray={dashed ? "3 3" : undefined} />
      {rings >= 2 && <circle cx="28" cy="28" r="12" fill={wash} opacity="0.4" />}
      {rings >= 3 && <circle cx="28" cy="28" r="6" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.45" />}
      <circle className="cover-pulse" cx={28 + (variant4 - 1.5) * 3} cy={28 + (variant % 2 === 0 ? -2 : 2)} r="3.5" fill={accent} opacity="0.8" />
    </svg>
  );
}

/** 未知标签：6 套通用几何 */
function GenericArt({ code, pal, variant }: { code: number; pal: Pal; variant: number }) {
  const { ink, wash, accent } = pal;
  if (code === 0) {
    return (
      <svg className="w-14 h-14" viewBox="0 0 56 56" aria-hidden>
        <path d="M8 40 Q28 8 48 40" fill="none" stroke={ink} strokeWidth="1.2" opacity="0.35" />
        <circle className="cover-pulse" cx="28" cy="22" r="3" fill={accent} opacity="0.7" />
      </svg>
    );
  }
  if (code === 1) {
    return (
      <svg className="w-16 h-12" viewBox="0 0 64 48" aria-hidden>
        <polyline points="4,36 20,16 36,28 60,10" fill="none" stroke={ink} strokeWidth="1.2" opacity="0.38" />
        <circle className="cover-pulse" cx={variant % 2 ? 20 : 36} cy={variant % 2 ? 16 : 28} r="2.5" fill={accent} opacity="0.75" />
      </svg>
    );
  }
  if (code === 2) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1.5 ${i === 1 ? "cover-pulse" : ""}`}
            style={{ width: 28 + i * 12, backgroundColor: i === 1 ? accent : wash, opacity: 0.5 }}
          />
        ))}
      </div>
    );
  }
  if (code === 3) {
    return (
      <div className="relative w-12 h-12">
        <span className="absolute inset-0 border" style={{ borderColor: ink, opacity: 0.3 }} />
        <span className="absolute inset-2 border" style={{ borderColor: accent, opacity: 0.45 }} />
        <span className="absolute right-1 top-1 w-2 h-2 cover-pulse" style={{ backgroundColor: accent, opacity: 0.6 }} />
      </div>
    );
  }
  if (code === 4) {
    return (
      <div className="relative w-12 h-12">
        <span className="absolute inset-0 rounded-full border-dashed border" style={{ borderColor: ink, opacity: 0.3 }} />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full cover-pulse" style={{ backgroundColor: accent, opacity: 0.7 }} />
      </div>
    );
  }
  return (
    <>
      <span className="block w-12 h-12" style={{ backgroundColor: wash, opacity: 0.5, clipPath: "polygon(0 20%, 100% 0, 80% 100%, 0 85%)" }} />
      <span className="absolute ml-8 mt-6 w-2 h-2 cover-pulse" style={{ backgroundColor: accent, opacity: 0.65 }} />
    </>
  );
}

function Motif({ symbol, genericCode, pal, variant, variant4, zone }: {
  symbol: TagSymbol | null;
  genericCode: number;
  pal: Pal;
  variant: number;
  variant4: number;
  zone: Zone;
}) {
  return (
    <div className={`absolute ${ZONE_CLASS[zone]} cover-breathe`}>
      {symbol ? (
        <SymbolArt symbol={symbol} pal={pal} variant={variant} variant4={variant4} />
      ) : (
        <GenericArt code={genericCode} pal={pal} variant={variant} />
      )}
    </div>
  );
}

function DiagonalFurnish({ ink, wash, accent, variant }: Pal & { variant: number }) {
  return (
    <>
      <span
        className="absolute left-0 bottom-0 w-[55%] h-[38%]"
        style={{ background: `linear-gradient(135deg, transparent 40%, ${wash} 40%)`, opacity: 0.4 }}
      />
      <span className="absolute right-[18%] top-[28%] w-[18%] aspect-square" style={{ backgroundColor: wash, opacity: 0.35 }} />
      <span
        className="absolute right-[12%] top-[34%] w-[10%] aspect-square cover-pulse"
        style={{ backgroundColor: accent, opacity: variant % 2 ? 0.4 : 0.25 }}
      />
    </>
  );
}

export interface CoverArtProps {
  post: Post;
  ratio?: "wide" | "card";
  noBorder?: boolean;
  className?: string;
}

/** 分类定色；母题由标签符号/通用几何驱动；5 套构图模板轮换 */
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
  const palette = { paper: "var(--ap)", ink: "var(--ai)", wash: "var(--aw)", accent: "var(--aa)" };

  const tags = (post as any).tags as string[] | undefined;
  const seed = (post.title || "") + cat + (post.id || "") + (tags?.join(",") || "");
  const variant = useMemo(() => hashVariant(seed, 8), [seed]);
  const variant4 = useMemo(() => hashVariant(seed + "4", 4), [seed]);
  const layout = useMemo(() => hashVariant(seed + "L", 5), [seed]);
  const symbol = useMemo(() => resolveTagSymbol(tags), [tags]);
  const genericCode = useMemo(() => {
    const t = resolveTagPrimary(tags) || seed;
    return hashVariant(String(t), 6);
  }, [tags, seed]);

  const initial = (post.title || "A").charAt(0);
  const abbr = (CAT_ABBR as any)[cat] || cat.slice(0, 3).toUpperCase();
  const noNum = useMemo(
    () => String(hashVariant(post.id || post.title || "0", 9000) + 1000).padStart(4, "0"),
    [post.id, post.title]
  );
  const tag = resolveTagPrimary(tags);
  const aspect = ratio === "wide" ? "aspect-[16/10]" : "aspect-[16/9]";
  const serifSize = ratio === "wide" ? "text-4xl" : "text-3xl";
  const pal: Pal = palette;

  const motifZone: Zone =
    layout === 0 ? "right" : layout === 1 ? "left" : layout === 3 ? "br" : layout === 4 ? "bl" : "right";

  const motif = (
    <Motif symbol={symbol} genericCode={genericCode} pal={pal} variant={variant} variant4={variant4} zone={motifZone} />
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
      className={`group relative w-full overflow-hidden rounded-none ${aspect} cover cover-loop art-${cat} ${noBorder ? "" : "border border-[var(--yh-border)]"} ${className}`}
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
            <div
              className="absolute right-[12%] bottom-[24%] mono text-[11px] tracking-[0.2em]"
              style={{ color: palette.ink, opacity: 0.35 }}
            >
              {initial.toUpperCase()}
            </div>
          </>
        )}
        {layout === 2 && (
          <>
            <DiagonalFurnish ink={palette.ink} wash={palette.wash} accent={palette.accent} variant={variant} />
            {motif}
          </>
        )}
        {layout === 3 && (
          <>
            <div className="absolute inset-x-0 top-0 h-[34%]" style={{ backgroundColor: palette.wash, opacity: 0.3 }} />
            <div className="absolute left-5 top-[12%]">{letter}</div>
            {motif}
          </>
        )}
        {layout === 4 && (
          <>
            <div className="absolute inset-4 border pointer-events-none" style={{ borderColor: palette.ink, opacity: 0.1 }} />
            <div
              className="absolute right-5 top-4 mono text-[10px] tracking-[0.18em]"
              style={{ color: palette.ink, opacity: 0.3 }}
            >
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
