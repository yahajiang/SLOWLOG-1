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
function FallbackCover({ initial, palette, variant }: { initial: string; palette: any; variant: number }) {
  const F: React.JSX.Element[] = [
    // 0: 单字居中 + 底线
    <div key={0} className="absolute inset-0 flex flex-col items-center justify-center gap-4">
      <span className="text-7xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      <span className="w-10 h-px" style={{ backgroundColor: palette.ink }} />
    </div>,
    // 1: 首字 + 角点
    <div key={1} className="absolute inset-0">
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      <span className="absolute top-6 right-6 w-2 h-2 rounded-full" style={{ backgroundColor: palette.ink }} />
      <span className="absolute bottom-6 left-6 w-2 h-2 rounded-full" style={{ backgroundColor: palette.ink }} />
    </div>,
    // 2: 左竖线 + 文字
    <div key={2} className="absolute inset-0 flex items-center justify-center gap-4">
      <span className="w-px h-12" style={{ backgroundColor: palette.ink }} />
      <span className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      <span className="w-px h-12" style={{ backgroundColor: palette.ink }} />
    </div>,
    // 3: 大字 + 底行
    <div key={3} className="absolute inset-0 flex flex-col items-center justify-center">
      <span className="text-7xl font-serif leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      <span className="text-[11px] tracking-[0.3em] mt-3 select-none" style={{ color: palette.ink }}>· · ·</span>
    </div>,
    // 4: 括号文字
    <div key={4} className="absolute inset-0 flex items-center justify-center">
      <span className="text-6xl font-serif italic leading-none select-none flex items-center gap-2" style={{ color: palette.ink }}>
        <span className="text-3xl font-light">［</span>{initial}<span className="text-3xl font-light">］</span>
      </span>
    </div>,
    // 5: 斜线 + 文字
    <div key={5} className="absolute inset-0 flex items-center justify-center gap-3">
      <span className="w-8 h-px rotate-12" style={{ backgroundColor: palette.ink }} />
      <span className="text-5xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      <span className="w-8 h-px -rotate-12" style={{ backgroundColor: palette.ink }} />
    </div>,
    // 6: 上档线 + 文字 + 底线
    <div key={6} className="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <span className="w-12 h-px" style={{ backgroundColor: palette.ink }} />
      <span className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      <span className="w-12 h-px" style={{ backgroundColor: palette.ink }} />
    </div>,
    // 7: 序号标签
    <div key={7} className="absolute inset-0 flex items-center justify-center gap-6">
      <span className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      <span className="text-xs tracking-[0.4em] select-none flex flex-col leading-tight" style={{ color: palette.ink }}>—<br />—</span>
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
  const palette = ART_PALETTES[catName] || ART_PALETTES[post.category] || { paper: "#F2F0EC", ink: "#2C2A26", wash: "#E8E2DA" };
  const variantSeed = (post.title || "") + catName + (post.id || "");
  const variant = useMemo(() => hashVariant(variantSeed, 8), [variantSeed]);
  const initial = post.title.charAt(0);
  const no = useMemo(() => (post.id || "").slice(0, 4).toUpperCase(), [post.id]);
  const KNOWN = ["Design", "Plugin", "Engineering", "Typography", "Frontend", "Snippet", "Life"];
  const isKnown = KNOWN.includes(catName);
  const shift = variant <= 2 ? "left-6" : variant <= 4 ? "left-1/3" : variant === 5 ? "left-1/4" : variant === 6 ? "right-6" : "right-1/4";

  // 按分类给文字变体做主题微调
  const theme = useMemo(() => {
    switch (catName) {
      case "Design": return { family: "font-serif italic", letterSpacing: "0", weight: "" } as const;
      case "Plugin": return { family: "font-mono", letterSpacing: "tracking-widest", weight: "font-bold" } as const;
      case "Engineering": return { family: "font-mono", letterSpacing: "tracking-tight", weight: "" } as const;
      case "Typography": return { family: "font-serif", letterSpacing: "tracking-[0.1em]", weight: "" } as const;
      case "Frontend": return { family: "font-mono", letterSpacing: "", weight: "" } as const;
      case "Snippet": return { family: "font-serif italic", letterSpacing: "", weight: "font-light" } as const;
      case "Life": return { family: "font-serif", letterSpacing: "", weight: "" } as const;
      default: return { family: "font-serif italic", letterSpacing: "", weight: "" } as const;
    }
  }, [catName]);

  return (
    <div
      aria-hidden="true"
      className={`group relative w-full overflow-hidden border-b border-zinc-200 ${tall ? "aspect-[4/5]" : "aspect-[16/9]"}`}
      style={{ backgroundColor: palette.paper }}
    >
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${palette.wash} 3px, ${palette.wash} 4px)` }} />

      {/* ---------- Design：复刻 bolg Design，首字位移 + 底线/圆点/编号 ---------- */}
      {catName === "Design" && (
        <>
          <span className={`absolute -top-6 font-serif italic leading-none select-none ${shift} ${tall ? "text-[11rem]" : "text-[8rem]"}`} style={{ color: palette.ink }}>{initial}</span>
          <span className={`absolute bottom-4 right-6 block rounded-full mix-blend-multiply ${tall ? "h-24 w-24" : "h-16 w-16"}`} style={{ backgroundColor: palette.wash, border: `1px solid ${palette.ink}` }} />
          <span className="absolute bottom-5 left-6 right-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.35 }} />
          <span className="absolute bottom-7 left-6 font-serif italic text-sm select-none" style={{ color: palette.ink }}>No. {no}</span>
        </>
      )}

      {/* ---------- Plugin / Frontend / Snippet / Life：极简单字 + 右下编号（bolg 规则复用） ---------- */}
      {(catName === "Plugin" || catName === "Frontend" || catName === "Snippet" || catName === "Life") && (
        <>
          <span className={`absolute ${tall ? "-top-4 text-[10rem]" : "top-4 text-[7rem]"} font-serif italic leading-none select-none ${shift}`} style={{ color: palette.ink }}>{initial}</span>
          <span className="absolute bottom-6 left-6 font-mono text-[11px] tracking-[0.2em] select-none" style={{ color: palette.ink }}>No. {no} · {catName.toLowerCase()}</span>
          <span className={`absolute bottom-4 right-6 rounded-full ${tall ? "h-20 w-20" : "h-14 w-14"}`} style={{ backgroundColor: palette.wash, border: `1px solid ${palette.ink}` }} />
        </>
      )}

      {/* ---------- Engineering：复刻 bolg Technology（网格 + 首字位移 + 线/圆） ---------- */}
      {catName === "Engineering" && (
        <>
          <div className="absolute inset-4" style={{ backgroundImage: `linear-gradient(${palette.wash} 1px, transparent 1px), linear-gradient(90deg, ${palette.wash} 1px, transparent 1px)`, backgroundSize: "28px 28px", opacity: 0.6 }} />
          <span className={`absolute top-1/3 ${shift} h-2 w-2 rounded-full`} style={{ backgroundColor: palette.ink }} />
          <span className="absolute top-1/3 left-6 right-10 h-px" style={{ backgroundColor: palette.ink, opacity: 0.35 }} />
          <span className="absolute bottom-6 left-6 font-mono text-[10px] tracking-[0.2em] select-none" style={{ color: palette.ink }}>No. {no}</span>
          <span className="absolute bottom-6 right-8 h-10 w-10 rounded-full border" style={{ borderColor: palette.ink }} />
        </>
      )}

      {/* ---------- Typography：复刻排版克制（首字 + 单线） ---------- */}
      {catName === "Typography" && (
        <>
          <span className={`absolute top-6 font-serif italic text-6xl leading-none select-none ${shift}`} style={{ color: palette.ink }}>{initial}</span>
          <span className="absolute bottom-6 left-6 right-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.25 }} />
          <span className="absolute bottom-8 left-6 font-mono text-[10px] tracking-[0.3em] select-none" style={{ color: palette.ink }}>TYPE · No.{no}</span>
        </>
      )}


      {/* Fallback */}
      {!isKnown && <FallbackCover initial={initial} palette={palette} variant={variant} />}
    </div>
  );
});
