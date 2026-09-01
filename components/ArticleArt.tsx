import { memo, useMemo } from "react";
import { ART_PALETTES } from "@/lib/categories";
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

// 通用封面：极简文字为主，单线/圆点点缀
function FallbackCover({ initial, palette, variant }: { initial: string; palette: any; variant: number; no?: string; tall?: boolean }) {
  const F: React.JSX.Element[] = [
    <div key={0} className="absolute inset-0">
      <span className="absolute -top-6 font-serif italic leading-none select-none left-6 text-[8rem]" style={{ color: palette.ink }}>{initial}</span>
      <span className="absolute bottom-4 right-6 block rounded-full mix-blend-multiply h-16 w-16" style={{ backgroundColor: palette.wash, border: `1px solid ${palette.ink}` }} />
      <span className="absolute bottom-5 left-6 right-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.35 }} />
      <span className="absolute bottom-7 left-6 font-serif italic text-sm select-none" style={{ color: palette.ink }}>No. {variant}</span>
    </div>,
    <div key={1} className="absolute inset-0">
      <div className="absolute inset-4" style={{ backgroundImage: `linear-gradient(${palette.wash} 1px, transparent 1px), linear-gradient(90deg, ${palette.wash} 1px, transparent 1px)`, backgroundSize: "28px 28px", opacity: 0.6 }} />
      <span className="absolute top-1/3 left-6 h-2 w-2 rounded-full" style={{ backgroundColor: palette.ink }} />
      <span className="absolute bottom-6 right-8 h-10 w-10 rounded-full border" style={{ borderColor: palette.ink }} />
    </div>,
    <div key={2} className="absolute inset-x-8 bottom-0 top-1/4 flex items-end gap-2">
      {[34, 58, 44, 76, 62, 92].map((h, i) => (
        <span key={i} className="flex-1" style={{ height: `${h}%`, backgroundColor: i % 3 === 0 ? palette.ink : palette.wash, border: `1px solid ${palette.ink}`, borderBottom: "none" }} />
      ))}
    </div>,
    <div key={3} className="absolute inset-0">
      <span className="absolute top-6 h-20 w-20 rounded-full mix-blend-multiply left-6" style={{ backgroundColor: palette.wash }} />
      <span className="absolute top-10 h-20 w-20 rounded-full mix-blend-multiply left-1/2" style={{ backgroundColor: palette.ink, opacity: 0.25 }} />
      <span className="absolute bottom-5 left-6 right-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.5 }} />
      <span className="absolute bottom-8 left-6 font-serif italic text-sm select-none" style={{ color: palette.ink }}>{initial}</span>
    </div>,
    <div key={4} className="absolute inset-0 flex items-center justify-center">
      <span className="text-7xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
    </div>,
    <div key={5} className="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <span className="w-10 h-px" style={{ backgroundColor: palette.ink }} />
      <span className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      <span className="w-10 h-px" style={{ backgroundColor: palette.ink }} />
    </div>,
    <div key={6} className="absolute inset-0 flex items-center justify-center gap-3">
      <span className="w-6 h-px" style={{ backgroundColor: palette.ink }} />
      <span className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      <span className="w-6 h-px" style={{ backgroundColor: palette.ink }} />
    </div>,
    <div key={7} className="absolute inset-0 flex items-center justify-center gap-4">
      <span className="w-12 h-12 rounded-lg border-2" style={{ borderColor: palette.ink }} />
      <span className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      <span className="w-12 h-12 rounded-lg border-2" style={{ borderColor: palette.ink }} />
    </div>,
  ];
  return F[variant] || F[0];
}

export const ArticleArt = memo(function ArticleArt({
  post,
  tall = false,
}: {
  post: Post;
  tall?: boolean;
}) {
  const catName = getCategoryName(post.category);
  const palette = ART_PALETTES[catName] || ART_PALETTES[post.category] || { paper: "#F8F7F4", ink: "#2B2926", wash: "#E8E2DA" };
  const variantSeed = (post.title || "") + catName + (post.id || "");
  const variant = useMemo(() => hashVariant(variantSeed, 8), [variantSeed]);
  const initial = post.title.charAt(0);
  const no = useMemo(() => (post.id || "").slice(0, 4).toUpperCase(), [post.id]);
  const KNOWN = ["Design", "Plugin", "Engineering", "Typography", "Frontend", "Snippet", "Life"];
  const isKnown = KNOWN.includes(catName);
  const shift = variant <= 2 ? "left-6" : variant <= 4 ? "left-1/3" : variant === 5 ? "left-1/4" : variant === 6 ? "right-6" : "right-1/4";

  return (
    <div
      aria-hidden="true"
      className={`group relative w-full overflow-hidden border-b border-zinc-200 ${tall ? "aspect-[4/5]" : "aspect-[16/9]"}`}
      style={{ backgroundColor: palette.paper }}
    >
      {/* 纸纹 — 复刻 bolg: 横纹纸 */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${palette.wash} 3px, ${palette.wash} 4px)` }} />

      {/* ---------- Design：首字斜切 + 纸纹 + 装饰圆 ---------- */}
      {catName === "Design" && (
        <>
          <span className={`absolute -top-6 font-serif italic leading-none select-none ${shift} ${tall ? "text-[11rem]" : "text-[8rem]"}`} style={{ color: palette.ink }}>{initial}</span>
          <span className={`absolute bottom-4 right-6 block rounded-full mix-blend-multiply ${tall ? "h-24 w-24" : "h-16 w-16"}`} style={{ backgroundColor: palette.wash, border: `1px solid ${palette.ink}` }} />
          <span className="absolute bottom-5 left-6 right-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.25 }} />
          <span className="absolute bottom-7 left-6 font-mono text-[11px] tracking-[0.2em] select-none" style={{ color: palette.ink }}>No. {no}</span>
        </>
      )}

      {/* ---------- Plugin：网格 + 点 + 圆 + 编号（复刻 bolg Technology 图形感，去大字） ---------- */}
      {catName === "Plugin" && (
        <>
          <div className="absolute inset-4" style={{ backgroundImage: `linear-gradient(${palette.wash} 1px, transparent 1px), linear-gradient(90deg, ${palette.wash} 1px, transparent 1px)`, backgroundSize: "24px 24px", opacity: 0.5 }} />
          <span className={`absolute top-1/3 ${shift} h-2 w-2 rounded-full`} style={{ backgroundColor: palette.ink }} />
          <span className="absolute top-1/3 left-6 right-10 h-px" style={{ backgroundColor: palette.ink, opacity: 0.3 }} />
          <span className="absolute bottom-6 left-6 font-mono text-[11px] tracking-[0.2em] select-none" style={{ color: palette.ink }}>No. {no} · plug</span>
          <span className="absolute bottom-6 right-8 h-10 w-10 rounded-full border" style={{ borderColor: palette.ink }} />
          <span className="absolute bottom-6 right-8 h-10 w-10 rounded-full border translate-x-2 -translate-y-2 opacity-35" style={{ borderColor: palette.ink }} />
        </>
      )}

      {/* ---------- Engineering：网格 + 点 + 线 + 圆（复刻 bolg Technology） ---------- */}
      {catName === "Engineering" && (
        <>
          <div className="absolute inset-4" style={{ backgroundImage: `linear-gradient(${palette.wash} 1px, transparent 1px), linear-gradient(90deg, ${palette.wash} 1px, transparent 1px)`, backgroundSize: "28px 28px", opacity: 0.6 }} />
          <span className={`absolute top-1/3 ${shift} h-2 w-2 rounded-full`} style={{ backgroundColor: palette.ink }} />
          <span className="absolute top-1/3 left-6 right-10 h-px" style={{ backgroundColor: palette.ink, opacity: 0.35 }} />
          <span className="absolute bottom-6 left-6 font-mono text-[10px] tracking-[0.2em] select-none" style={{ color: palette.ink }}>No. {no}</span>
          <span className="absolute bottom-6 right-8 h-10 w-10 rounded-full border" style={{ borderColor: palette.ink }} />
        </>
      )}

      {/* ---------- Frontend / Snippet / Life：细线 + 小字标签 ---------- */}
      {(catName === "Frontend" || catName === "Snippet" || catName === "Life") && (
        <>
          <span className={`absolute top-6 font-mono text-[11px] tracking-[0.3em] select-none ${shift}`} style={{ color: palette.ink }}>{catName.toLowerCase()} · No.{no}</span>
          <span className="absolute bottom-6 left-6 right-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.2 }} />
          <span className="absolute bottom-8 left-6 font-serif italic text-lg leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
        </>
      )}

      {/* ---------- Typography：克制排版 ---------- */}
      {catName === "Typography" && (
        <>
          <span className={`absolute top-6 font-serif italic text-5xl leading-none select-none ${shift}`} style={{ color: palette.ink }}>{initial}</span>
          <span className="absolute bottom-6 left-6 right-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.2 }} />
          <span className="absolute bottom-8 left-6 font-mono text-[10px] tracking-[0.3em] select-none" style={{ color: palette.ink }}>TYPE · No.{no}</span>
        </>
      )}


      {/* Fallback */}
      {!isKnown && <FallbackCover initial={initial} palette={palette} variant={variant} />}
    </div>
  );
});
