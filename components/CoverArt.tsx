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

/** 8 族标签符号：加厚加层，强化辨识 */
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
      <div className="relative">
        <div className="grid grid-cols-2 gap-[6px]">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="w-7 h-7 border-2"
              style={{
                borderColor: ink,
                backgroundColor: i === solid ? accent : i === 3 - solid ? wash : "transparent",
                opacity: 0.55,
              }}
            />
          ))}
        </div>
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full cover-pulse"
          style={{ backgroundColor: accent, opacity: 0.85 }}
        />
        <span className="absolute -left-3 top-1/2 w-2 h-px" style={{ backgroundColor: ink, opacity: 0.35 }} />
        <span className="absolute -right-3 top-1/2 w-2 h-px" style={{ backgroundColor: ink, opacity: 0.35 }} />
      </div>
    );
  }
  if (symbol === "shield") {
    return (
      <svg className="w-16 h-18" width="64" height="72" viewBox="0 0 64 72" aria-hidden>
        <path
          d="M32 6 L56 16 V36 Q56 56 32 66 Q8 56 8 36 V16 Z"
          fill={wash}
          stroke={ink}
          strokeWidth="1.8"
          opacity="0.6"
        />
        <path d="M32 18 V46" stroke={accent} strokeWidth="2" opacity="0.75" />
        <path d="M22 32 H42" stroke={ink} strokeWidth="1.2" opacity="0.35" />
        <circle className="cover-pulse" cx="32" cy="32" r="4.5" fill={accent} opacity="0.9" />
      </svg>
    );
  }
  if (symbol === "doubleCircle") {
    return (
      <div className="relative w-20 h-20">
        <span className="absolute left-0 top-3 w-14 h-14 rounded-full border-2" style={{ borderColor: ink, opacity: 0.4 }} />
        <span
          className="absolute right-0 bottom-0 w-14 h-14 rounded-full border-2"
          style={{ borderColor: wash, backgroundColor: wash, opacity: 0.55 }}
        />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full cover-pulse" style={{ backgroundColor: accent, opacity: 0.85 }} />
        <span className="absolute left-2 top-1/2 w-4 h-px rotate-45" style={{ backgroundColor: ink, opacity: 0.25 }} />
      </div>
    );
  }
  if (symbol === "wave") {
    return (
      <svg className="w-20 h-16" viewBox="0 0 80 64" aria-hidden>
        <path d="M4 36 Q20 14 40 36 T76 36" fill="none" stroke={ink} strokeWidth="1.8" opacity="0.45" />
        <path className="cover-flow" d="M4 46 Q20 26 40 46 T76 46" fill="none" stroke={accent} strokeWidth="1.4" opacity="0.7" />
        <circle className="cover-pulse" cx="40" cy="20" r="4" fill={accent} opacity="0.85" />
        <path d="M28 8 Q32 2 36 8" fill="none" stroke={ink} strokeWidth="1" opacity="0.3" />
        <path d="M44 8 Q48 2 52 8" fill="none" stroke={ink} strokeWidth="1" opacity="0.25" />
      </svg>
    );
  }
  if (symbol === "diamond") {
    return (
      <svg className="w-18 h-18" width="72" height="72" viewBox="0 0 72 72" aria-hidden>
        <polygon points="36,6 66,36 36,66 6,36" fill="none" stroke={ink} strokeWidth="1.6" opacity="0.45" />
        <polygon points="36,18 54,36 36,54 18,36" fill={wash} opacity="0.55" />
        <polygon points="36,28 44,36 36,44 28,36" fill="none" stroke={accent} strokeWidth="1" opacity="0.55" />
        <circle className="cover-pulse" cx="36" cy="36" r="4" fill={accent} opacity="0.9" />
        <line x1="36" y1="2" x2="36" y2="10" stroke={ink} strokeWidth="1" opacity="0.3" />
        <line x1="36" y1="62" x2="36" y2="70" stroke={ink} strokeWidth="1" opacity="0.3" />
      </svg>
    );
  }
  if (symbol === "window") {
    return (
      <div className="w-20 h-16 border-2" style={{ borderColor: ink, opacity: 0.5 }}>
        <div className="flex items-center gap-1.5 px-2 h-4 border-b-2" style={{ borderColor: wash, backgroundColor: wash, opacity: 0.9 }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent, opacity: 0.9 }} />
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ink, opacity: 0.3 }} />
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ink, opacity: 0.18 }} />
        </div>
        <div className="p-2 space-y-1.5">
          <span className="block h-1.5 w-4/5" style={{ backgroundColor: ink, opacity: 0.18 }} />
          <span className="block h-1.5 w-3/5" style={{ backgroundColor: wash }} />
          <span className="block h-1.5 w-1/2" style={{ backgroundColor: accent, opacity: 0.35 }} />
        </div>
      </div>
    );
  }
  if (symbol === "hex") {
    return (
      <svg className="w-18 h-18" width="72" height="72" viewBox="0 0 72 72" aria-hidden>
        <polygon points="36,4 64,20 64,52 36,68 8,52 8,20" fill={wash} stroke={ink} strokeWidth="1.6" opacity="0.5" />
        <polygon points="36,18 52,27 52,45 36,54 20,45 20,27" fill="none" stroke={ink} strokeWidth="1" opacity="0.35" />
        <line x1="36" y1="24" x2="24" y2="36" stroke={ink} strokeWidth="1" opacity="0.35" />
        <line x1="36" y1="24" x2="48" y2="36" stroke={ink} strokeWidth="1" opacity="0.35" />
        <line x1="24" y1="36" x2="48" y2="36" stroke={accent} strokeWidth="1.2" opacity="0.5" />
        <circle className="cover-pulse" cx="36" cy="38" r="4" fill={accent} opacity="0.9" />
      </svg>
    );
  }
  // circle — 多环 + 轨道点
  const rings = 2 + (variant % 2);
  const dashed = variant4 % 2 === 0;
  return (
    <svg className="w-20 h-20" viewBox="0 0 72 72" aria-hidden>
      <circle cx="36" cy="36" r="28" fill="none" stroke={ink} strokeWidth="1.4" opacity="0.28" strokeDasharray={dashed ? "4 4" : undefined} />
      <circle cx="36" cy="36" r="18" fill={wash} opacity="0.45" />
      {rings >= 3 && <circle cx="36" cy="36" r="10" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.55" />}
      <circle className="cover-pulse" cx={36 + (variant4 - 1.5) * 5} cy={36 + (variant % 2 === 0 ? -3 : 3)} r="5" fill={accent} opacity="0.95" />
      <circle cx="36" cy="36" r="2" fill={ink} opacity="0.4" />
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
      <div className="absolute top-0 left-5 right-5 h-px" style={{ backgroundColor: palette.ink, opacity: 0.08 }} />
      <span className="absolute top-3 right-4 w-1.5 h-1.5 cover-pulse" style={{ backgroundColor: palette.accent, opacity: 0.7 }} />
      {/* 分类底纹家具：强化族感 */}
      {cat === "Plugin" && (
        <div
          className="absolute inset-3 pointer-events-none opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(${palette.ink} 1px, transparent 1px), linear-gradient(90deg, ${palette.ink} 1px, transparent 1px)`,
            backgroundSize: "16px 16px",
          }}
        />
      )}
      {cat === "Engineering" && (
        <svg className="absolute inset-x-0 bottom-8 h-10 w-full opacity-[0.12]" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden>
          <path d="M0 28 L40 16 L90 26 L140 10 L200 20" fill="none" stroke={palette.ink} strokeWidth="1" />
        </svg>
      )}
      {cat === "Typography" && (
        <div className="absolute inset-x-6 top-8 bottom-12 pointer-events-none opacity-[0.08]">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="block h-px mb-3" style={{ backgroundColor: palette.ink }} />
          ))}
        </div>
      )}
      {cat === "Design" && (
        <span className="absolute left-4 top-6 bottom-10 w-px opacity-20" style={{ backgroundColor: palette.ink }} />
      )}
      {cat === "Life" && (
        <span
          className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full border opacity-15"
          style={{ borderColor: palette.ink }}
        />
      )}

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
