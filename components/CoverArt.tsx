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

type Pal = { paper: string; ink: string; wash: string; accent: string };

const STAMP_CODE: Record<string, string> = {
  grid: "GRD",
  shield: "SHL",
  doubleCircle: "MIR",
  wave: "WAV",
  diamond: "DMN",
  window: "WIN",
  hex: "HEX",
  circle: "CIR",
};

/** 标签签名章：强轮廓 + accent 特征 + 下方 mono 代号，一眼可辨 */
function Stamp({ symbol, pal, variant4 }: { symbol: TagSymbol | null; pal: Pal; variant4: number }) {
  const { ink, wash, accent } = pal;
  const code = symbol ? STAMP_CODE[symbol] : "GEN";
  const mark = (() => {
    if (symbol === "grid") {
      const solid = variant4 % 4;
      return (
        <div className="grid grid-cols-2 gap-[6px] p-1.5 border-2" style={{ borderColor: ink, opacity: 0.7 }}>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="w-4 h-4"
              style={{
                border: `2px solid ${i === solid ? accent : ink}`,
                backgroundColor: i === solid ? accent : "transparent",
                opacity: i === solid ? 0.95 : 0.55,
              }}
            />
          ))}
        </div>
      );
    }
    if (symbol === "shield") {
      return (
        <svg width="44" height="52" viewBox="0 0 44 52" aria-hidden>
          <path d="M22 3 L39 11 V26 Q39 41 22 49 Q5 41 5 26 V11 Z" fill="none" stroke={ink} strokeWidth="2.4" opacity="0.7" />
          <path d="M22 14 V34" stroke={accent} strokeWidth="2.5" opacity="0.9" />
          <path d="M13 24 H31" stroke={accent} strokeWidth="2" opacity="0.75" />
        </svg>
      );
    }
    if (symbol === "doubleCircle") {
      return (
        <div className="relative w-14 h-12">
          <span className="absolute left-0 top-0 w-11 h-11 rounded-full border-[3px]" style={{ borderColor: ink, opacity: 0.65 }} />
          <span className="absolute right-0 bottom-0 w-11 h-11 rounded-full border-[3px]" style={{ borderColor: accent, opacity: 0.85 }} />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-px" style={{ backgroundColor: ink, opacity: 0.5 }} />
        </div>
      );
    }
    if (symbol === "wave") {
      return (
        <svg width="52" height="30" viewBox="0 0 52 30" aria-hidden>
          <path d="M2 10 Q14 2 26 10 T50 10" fill="none" stroke={ink} strokeWidth="2.2" opacity="0.65" />
          <path className="cover-flow" d="M2 18 Q14 10 26 18 T50 18" fill="none" stroke={accent} strokeWidth="2.2" opacity="0.9" />
          <path d="M2 26 Q14 18 26 26 T50 26" fill="none" stroke={ink} strokeWidth="1.4" opacity="0.35" />
        </svg>
      );
    }
    if (symbol === "diamond") {
      return (
        <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden>
          <polygon points="22,2 42,22 22,42 2,22" fill="none" stroke={accent} strokeWidth="2.4" opacity="0.9" />
          <polygon points="22,12 32,22 22,32 12,22" fill="none" stroke={ink} strokeWidth="1.6" opacity="0.55" />
          <line x1="22" y1="2" x2="22" y2="12" stroke={ink} strokeWidth="1.2" opacity="0.4" />
          <line x1="22" y1="32" x2="22" y2="42" stroke={ink} strokeWidth="1.2" opacity="0.4" />
        </svg>
      );
    }
    if (symbol === "window") {
      return (
        <div className="w-16 h-12 border-[3px]" style={{ borderColor: accent, opacity: 0.85 }}>
          <div className="flex items-center gap-1.5 px-1.5 h-3.5 border-b-2" style={{ borderColor: ink, opacity: 0.5 }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ink, opacity: 0.4 }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ink, opacity: 0.25 }} />
          </div>
          <div className="p-1.5 space-y-1">
            <span className="block h-[3px] w-4/5" style={{ backgroundColor: ink, opacity: 0.35 }} />
            <span className="block h-[3px] w-1/2" style={{ backgroundColor: ink, opacity: 0.2 }} />
          </div>
        </div>
      );
    }
    if (symbol === "hex") {
      return (
        <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden>
          <polygon points="23,2 41,13 41,33 23,44 5,33 5,13" fill="none" stroke={accent} strokeWidth="2.4" opacity="0.9" />
          <polygon points="23,13 32,18 32,28 23,33 14,28 14,18" fill="none" stroke={ink} strokeWidth="1.4" opacity="0.5" />
          <circle cx="23" cy="23" r="2" fill={ink} opacity="0.55" />
        </svg>
      );
    }
    if (symbol === "circle") {
      return (
        <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden>
          <circle cx="23" cy="23" r="18" fill="none" stroke={ink} strokeWidth="1.4" opacity="0.4" strokeDasharray="4 3" />
          <circle cx="23" cy="23" r="12" fill="none" stroke={accent} strokeWidth="2.2" opacity="0.9" />
          <circle cx="23" cy="23" r="4" fill={accent} opacity="0.95" />
          <line x1="23" y1="5" x2="23" y2="11" stroke={ink} strokeWidth="1.2" opacity="0.45" />
        </svg>
      );
    }
    return (
      <span
        className="block w-7 h-7 border-[3px] rotate-45"
        style={{ borderColor: accent, opacity: 0.8 }}
      />
    );
  })();

  return (
    <div className="flex flex-col items-center gap-1 cover-breathe">
      {mark}
      <span className="mono text-[8px] tracking-[0.22em]" style={{ color: ink, opacity: 0.4 }}>
        {code}
      </span>
    </div>
  );
}

/**
 * 8 套密拼贴构图：每套至少 5 个视觉件（色块/线/框/号/符号），
 * 由 layout + variant 决定摆位，避免同 tag 同质。
 */
function Collage({
  layout,
  pal,
  variant,
  variant4,
  stamp,
  initial,
  noNum,
  abbr,
}: {
  layout: number;
  pal: Pal;
  variant: number;
  variant4: number;
  stamp: React.ReactNode;
  initial: string;
  noNum: string;
  abbr: string;
}) {
  const { ink, wash, accent } = pal;
  const L = layout % 8;

  // 共用小件
  const tick = <span className="absolute w-2 h-px" style={{ backgroundColor: ink, opacity: 0.3 }} />;
  const dot = <span className="absolute w-1.5 h-1.5 cover-pulse" style={{ backgroundColor: accent, opacity: 0.75 }} />;

  if (L === 0) {
    // 左色块 + 右网格框 + 对角线 + 印章
    return (
      <div className="absolute inset-0 cover-breathe">
        <div className="absolute left-0 top-0 bottom-0 w-[38%] cover-piece" style={{ backgroundColor: wash, opacity: 0.2 }} />
        <div className="absolute left-[8%] top-[18%] w-[22%] h-[40%] border-2 cover-piece-2" style={{ borderColor: ink, opacity: 0.28 }} />
        <div className="absolute left-[14%] top-[26%] w-[10%] h-[16%] cover-piece-3 border" style={{ borderColor: accent, opacity: 0.35 }} />
        <svg className="absolute right-[12%] top-[20%] w-[36%] h-[42%]" viewBox="0 0 80 60" aria-hidden>
          <path d="M4 50 L40 12 L76 40" fill="none" stroke={ink} strokeWidth="1.4" opacity="0.35" />
          <circle className="cover-pulse" cx="40" cy="12" r="3" fill={accent} opacity="0.85" />
        </svg>
        <div className="absolute right-[16%] bottom-[28%]">{stamp}</div>
        <span className="absolute left-[42%] top-[22%] serif italic text-2xl" style={{ color: ink, opacity: 0.22 }}>{initial}</span>
        <span className="absolute right-[12%] top-[14%] mono text-[9px] tracking-[0.2em]" style={{ color: ink, opacity: 0.3 }}>{noNum}</span>
      </div>
    );
  }
  if (L === 1) {
    // 三横条阶梯 + 右上方阵 + 竖轴
    return (
      <>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute left-[10%] h-2"
            style={{
              top: `${28 + i * 14}%`,
              width: `${40 - i * 8}%`,
              backgroundColor: i === variant4 % 3 ? accent : wash,
              opacity: i === variant4 % 3 ? 0.28 : 0.2,
            }}
          />
        ))}
        <div className="absolute right-[14%] top-[22%] border-2 p-1.5" style={{ borderColor: ink, opacity: 0.4 }}>
          <div className="grid grid-cols-2 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="w-3 h-3 border" style={{ borderColor: ink, backgroundColor: i === variant % 4 ? accent : "transparent", opacity: 0.4 }} />
            ))}
          </div>
        </div>
        <span className="absolute left-[48%] top-[18%] bottom-[30%] w-px" style={{ backgroundColor: ink, opacity: 0.18 }} />
        <div className="absolute right-[18%] bottom-[26%]">{stamp}</div>
        <span className="absolute left-[10%] top-[18%] mono text-[10px] tracking-[0.18em]" style={{ color: ink, opacity: 0.32 }}>{abbr}</span>
      </>
    );
  }
  if (L === 2) {
    // 大斜切 + 圆环组 + 角标数字
    return (
      <>
        <div
          className="absolute left-0 bottom-0 w-[70%] h-[48%]"
          style={{ background: `linear-gradient(120deg, ${wash} 0%, transparent 55%)`, opacity: 0.22 }}
        />
        <svg className="absolute right-[10%] top-[16%] w-[40%] h-[48%]" viewBox="0 0 80 70" aria-hidden>
          <circle cx="40" cy="35" r="26" fill="none" stroke={ink} strokeWidth="1.3" opacity="0.28" strokeDasharray="4 3" />
          <circle cx="40" cy="35" r="14" fill="none" stroke={wash} strokeWidth="1.2" opacity="0.45" />
          <circle className="cover-pulse" cx="40" cy="35" r="4" fill={accent} opacity="0.9" />
        </svg>
        <span className="absolute left-[12%] top-[22%] serif italic text-3xl" style={{ color: ink, opacity: 0.2 }}>{initial}</span>
        <div className="absolute left-[14%] bottom-[28%]">{stamp}</div>
        <span className="absolute right-[14%] bottom-[26%] mono text-[11px]" style={{ color: accent, opacity: 0.55 }}>No.{noNum}</span>
      </>
    );
  }
  if (L === 3) {
    // 上带 + 下分栏 + 中线
    return (
      <>
        <div className="absolute inset-x-0 top-0 h-[30%] border-b" style={{ borderColor: wash, opacity: 0.35 }} />
        <div className="absolute left-[8%] right-[8%] top-[30%] h-px" style={{ backgroundColor: ink, opacity: 0.25 }} />
        <div className="absolute left-[8%] top-[38%] w-[36%] h-[28%] border" style={{ borderColor: ink, opacity: 0.3 }} />
        <div className="absolute left-[12%] top-[44%] w-[20%] h-1.5" style={{ backgroundColor: ink, opacity: 0.12 }} />
        <div className="absolute left-[12%] top-[52%] w-[14%] h-1.5 border" style={{ borderColor: wash, opacity: 0.5 }} />
        <div className="absolute right-[12%] top-[38%]">{stamp}</div>
        <span className="absolute right-[12%] top-[55%] w-8 h-8 border" style={{ borderColor: accent, opacity: 0.4 }} />
        <span className="absolute left-[8%] top-[12%] mono text-[9px] tracking-[0.2em]" style={{ color: ink, opacity: 0.35 }}>{noNum}</span>
      </>
    );
  }
  if (L === 4) {
    // 双层框 + 散点 + 竖排字
    return (
      <>
        <div className="absolute inset-5 border" style={{ borderColor: ink, opacity: 0.12 }} />
        <div className="absolute inset-8 border-2" style={{ borderColor: wash, opacity: 0.5 }} />
        <div className="absolute left-[18%] top-[30%] w-[28%] h-[28%] border" style={{ borderColor: accent, opacity: 0.35 }} />
        <div className="absolute right-[16%] top-[24%]">{stamp}</div>
        {[0, 1, 2].map((i) => (
          <span key={i} className={`absolute w-1 h-1 rounded-full ${i === 1 ? "cover-pulse" : ""}`} style={{
            left: `${55 + i * 8}%`,
            top: `${50 + (i % 2) * 12}%`,
            backgroundColor: i === 1 ? accent : ink,
            opacity: 0.45,
          }} />
        ))}
        <span className="absolute left-[12%] top-[20%] serif italic text-xl" style={{ color: ink, opacity: 0.25 }}>{initial}</span>
        <span className="absolute right-[10%] bottom-[28%] mono text-[9px] tracking-[0.15em]" style={{ color: ink, opacity: 0.3 }}>{abbr}·{variant}</span>
      </>
    );
  }
  if (L === 5) {
    // 折线路径 + 站点 + 色点簇
    return (
      <>
        <svg className="absolute inset-x-[8%] top-[20%] h-[45%]" viewBox="0 0 200 80" aria-hidden>
          <polyline points="10,60 50,30 90,45 130,18 190,35" fill="none" stroke={ink} strokeWidth="1.5" opacity="0.35" />
          <polyline className="cover-flow" points="10,70 60,55 120,62 190,48" fill="none" stroke={accent} strokeWidth="1.1" opacity="0.5" />
          <circle className="cover-pulse" cx="130" cy="18" r="4" fill={accent} opacity="0.9" />
          <circle cx="50" cy="30" r="2.5" fill={ink} opacity="0.3" />
        </svg>
        <div className="absolute left-[12%] bottom-[28%] flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-2.5 h-2.5 border" style={{ borderColor: i === variant4 ? accent : ink, backgroundColor: "transparent", opacity: 0.45 }} />
          ))}
        </div>
        <div className="absolute right-[14%] bottom-[28%]">{stamp}</div>
        <span className="absolute left-[12%] top-[14%] mono text-[9px] tracking-[0.2em]" style={{ color: ink, opacity: 0.3 }}>PATH {noNum}</span>
      </>
    );
  }
  if (L === 6) {
    // 竖栏杂志 + 巨号
    return (
      <>
        <div className="absolute left-0 top-0 bottom-0 w-[12%]" style={{ backgroundColor: ink, opacity: 0.08 }} />
        <span className="absolute left-[4%] top-1/2 -translate-y-1/2 -rotate-90 origin-center mono text-[8px] tracking-[0.3em]" style={{ color: ink, opacity: 0.3 }}>
          {abbr}
        </span>
        <div className="absolute left-[20%] top-[22%] w-[40%] h-[40%] border" style={{ borderColor: wash, opacity: 0.5 }} />
        <div className="absolute left-[28%] top-[30%] w-[24%] h-[24%] border-2" style={{ borderColor: ink, opacity: 0.3 }} />
        <span className="absolute left-[32%] top-[34%] serif text-3xl font-light" style={{ color: ink, opacity: 0.2 }}>{noNum.slice(-2)}</span>
        <div className="absolute right-[14%] top-[28%]">{stamp}</div>
        <span className="absolute right-[14%] bottom-[30%] w-10 h-px" style={{ backgroundColor: accent, opacity: 0.5 }} />
        <span className="absolute right-[14%] top-[20%] w-1.5 h-1.5 cover-pulse" style={{ backgroundColor: accent, opacity: 0.8 }} />
      </>
    );
  }
  // L7 — 点阵场 + 浮动块
  return (
    <>
      <div
        className="absolute inset-[12%] opacity-[0.12]"
        style={{
          backgroundImage: `radial-gradient(${ink} 1px, transparent 1px)`,
          backgroundSize: "12px 12px",
        }}
      />
      <div className="absolute left-[20%] top-[28%] w-[22%] h-[30%] rotate-[-6deg] border" style={{ borderColor: wash, opacity: 0.5 }} />
      <div className="absolute right-[18%] top-[32%] w-[16%] h-[22%] border-2" style={{ borderColor: ink, opacity: 0.28 }} />
      <div className="absolute right-[22%] top-[38%] w-[8%] h-[10%] border" style={{ borderColor: accent, opacity: 0.4 }} />
      <div className="absolute left-[24%] bottom-[28%]">{stamp}</div>
      <span className="absolute right-[18%] bottom-[28%] serif italic text-xl" style={{ color: ink, opacity: 0.22 }}>{initial}</span>
      {dot && <span className="absolute left-[48%] top-[22%] w-1.5 h-1.5 cover-pulse" style={{ backgroundColor: accent, opacity: 0.75 }} />}
      {tick && <span className="absolute left-[18%] top-[24%] w-6 h-px" style={{ backgroundColor: ink, opacity: 0.3 }} />}
    </>
  );
}

export interface CoverArtProps {
  post: Post;
  ratio?: "wide" | "card";
  noBorder?: boolean;
  className?: string;
}

/** 密拼贴封面：layout×variant×tag 共同驱动，同分类不再同质 */
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
  const title = post.title || "";
  // 标题字也进 seed：同 tag 不同文仍不同构图
  const seed = title + cat + (post.id || "") + (tags?.join(",") || "");
  const variant = useMemo(() => hashVariant(seed, 8), [seed]);
  const variant4 = useMemo(() => hashVariant(seed + "4", 4), [seed]);
  const layout = useMemo(() => hashVariant(title + (post.id || "") + "L", 8), [title, post.id]);
  const symbol = useMemo(() => resolveTagSymbol(tags), [tags]);

  const initial = (title || "A").charAt(0);
  const abbr = (CAT_ABBR as any)[cat] || cat.slice(0, 3).toUpperCase();
  const noNum = useMemo(
    () => String(hashVariant(post.id || title || "0", 9000) + 1000).padStart(4, "0"),
    [post.id, title]
  );
  const tag = resolveTagPrimary(tags);
  const aspect = ratio === "wide" ? "aspect-[16/10]" : "aspect-[16/9]";

  return (
    <div
      aria-hidden="true"
      className={`group relative w-full overflow-hidden rounded-none ${aspect} cover cover-loop art-${cat} ${noBorder ? "" : "border border-[var(--yh-border)]"} ${className}`}
      style={{ backgroundColor: palette.paper }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 5px, ${palette.wash} 5px, ${palette.wash} 6px)`,
          opacity: 0.045,
        }}
      />
      <div className="absolute top-0 left-4 right-4 h-px" style={{ backgroundColor: palette.ink, opacity: 0.08 }} />
      <div className="absolute inset-0 cover-inner">
        <Collage
          layout={layout}
          pal={palette}
          variant={variant}
          variant4={variant4}
          stamp={<Stamp symbol={symbol} pal={palette} variant4={variant4} />}
          initial={initial}
          noNum={noNum}
          abbr={abbr}
        />
      </div>
      <span className="absolute bottom-5 left-4 right-4 h-px" style={{ backgroundColor: palette.ink, opacity: 0.12 }} />
      <span
        className="absolute bottom-1.5 left-4 right-4 mono text-[9px] tracking-[0.14em] select-none"
        style={{ color: palette.ink, opacity: 0.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
      >
        {`${abbr} · ${noNum}${tag ? ` · ${String(tag).replace(/[[\]]/g, "").toUpperCase()}` : ""}`}
      </span>
    </div>
  );
});
