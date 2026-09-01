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
  const palette = ART_PALETTES[catName] || ART_PALETTES[post.category] || { paper: "#F9FAFB", ink: "#52525B", wash: "#E4E4E7" };
  const variantSeed = (post.title || "") + catName + (post.id || "");
  const variant = useMemo(() => hashVariant(variantSeed, 8), [variantSeed]);
  const initial = post.title.charAt(0);
  const KNOWN = ["Design", "Plugin", "Engineering", "Typography", "Frontend", "Snippet", "Life"];
  const isKnown = KNOWN.includes(catName);

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
      className={`group relative w-full overflow-hidden ${tall ? "aspect-[4/5]" : "aspect-[16/9]"}`}
      style={{ backgroundColor: palette.paper }}
    >
      <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(transparent 98%, ${palette.wash} 98%)`, backgroundSize: "100% 8px" }} />

      {/* ---------- Design：大字 + 单线 ---------- */}
      {catName === "Design" && variant === 0 && (
        <span className={`absolute left-6 font-serif italic leading-none select-none ${tall ? "text-[10rem] -top-4" : "text-[7rem] top-4"}`} style={{ color: palette.ink }}>{initial}</span>
      )}
      {catName === "Design" && variant === 1 && (
        <span className="absolute inset-0 flex items-center justify-center text-[5.5rem] font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      )}
      {catName === "Design" && variant === 2 && (
        <div className="absolute inset-0 flex items-center justify-center gap-3">
          <span className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="w-16 h-px" style={{ backgroundColor: palette.ink }} />
          <span className="text-xs tracking-[0.4em] select-none" style={{ color: palette.ink }}>设计</span>
        </div>
      )}
      {catName === "Design" && variant === 3 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span className="w-8 h-px" style={{ backgroundColor: palette.ink }} />
          <span className="text-7xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="w-8 h-px" style={{ backgroundColor: palette.ink }} />
        </div>
      )}
      {catName === "Design" && variant === 4 && (
        <span className="absolute inset-0 flex items-center justify-center text-8xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      )}
      {catName === "Design" && variant === 5 && (
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          <span className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="text-2xl leading-none select-none" style={{ color: palette.wash }}>·</span>
          <span className="text-sm tracking-widest select-none" style={{ color: palette.ink }}>{catName}</span>
        </div>
      )}
      {catName === "Design" && variant === 6 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] tracking-[0.5em] select-none" style={{ color: palette.ink }}>— DESIGN —</span>
          <span className="text-7xl font-serif italic leading-none select-none mt-2" style={{ color: palette.ink }}>{initial}</span>
        </div>
      )}
      {catName === "Design" && variant === 7 && (
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <span className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="text-[11px] tracking-[0.3em] select-none" style={{ color: palette.ink }}>—</span>
        </div>
      )}

      {/* ---------- Plugin：等宽 + 符号 ---------- */}
      {catName === "Plugin" && variant === 0 && (
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          <span className="text-5xl font-mono font-bold leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="text-2xl font-mono font-light leading-none select-none" style={{ color: palette.ink }}>+</span>
        </div>
      )}
      {catName === "Plugin" && variant === 1 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl font-mono font-bold leading-none select-none tracking-tighter" style={{ color: palette.ink }}>{initial}</span>
          <span className="ml-2 text-[11px] tracking-widest select-none self-end mb-6" style={{ color: palette.ink }}>/ PLUGIN</span>
        </div>
      )}
      {catName === "Plugin" && variant === 2 && (
        <div className="absolute inset-0 flex items-center justify-center gap-4">
          <span className="text-xs tracking-widest select-none" style={{ color: palette.ink }}>—</span>
          <span className="text-6xl font-mono font-bold leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="text-xs tracking-widest select-none" style={{ color: palette.ink }}>—</span>
        </div>
      )}
      {catName === "Plugin" && variant === 3 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-mono leading-none select-none" style={{ color: palette.ink }}>&lt;{initial}&gt;</span>
          <span className="text-[10px] tracking-[0.4em] select-none mt-2" style={{ color: palette.ink }}>PLUGIN</span>
        </div>
      )}
      {catName === "Plugin" && variant === 4 && (
        <div className="absolute inset-0 flex items-center justify-center gap-3">
          <span className="w-6 h-px" style={{ backgroundColor: palette.ink }} />
          <span className="text-6xl font-mono font-bold leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="w-6 h-px" style={{ backgroundColor: palette.ink }} />
        </div>
      )}
      {catName === "Plugin" && variant === 5 && (
        <span className="absolute inset-0 flex items-center justify-center text-7xl font-mono font-bold leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      )}
      {catName === "Plugin" && variant === 6 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl font-mono font-light leading-none select-none" style={{ color: palette.ink }}>[ {initial} ]</span>
        </div>
      )}
      {catName === "Plugin" && variant === 7 && (
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          <span className="text-6xl font-mono leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="text-lg font-mono select-none" style={{ color: palette.wash }}>· · ·</span>
        </div>
      )}

      {/* ---------- Engineering：代码感文字 ---------- */}
      {catName === "Engineering" && variant === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl font-mono font-bold leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="ml-3 w-px h-8" style={{ backgroundColor: palette.ink }} />
        </div>
      )}
      {catName === "Engineering" && variant === 1 && (
        <span className="absolute inset-0 flex items-center justify-center text-7xl font-mono font-bold leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      )}
      {catName === "Engineering" && variant === 2 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-mono leading-none select-none" style={{ color: palette.ink }}>&#123; {initial} &#125;</span>
          <span className="text-[10px] tracking-[0.5em] select-none mt-2" style={{ color: palette.ink }}>ENGINEERING</span>
        </div>
      )}
      {catName === "Engineering" && variant === 3 && (
        <div className="absolute inset-0 flex items-center justify-center gap-3">
          <span className="text-xs font-mono select-none" style={{ color: palette.ink }}>//</span>
          <span className="text-6xl font-mono font-bold leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
        </div>
      )}
      {catName === "Engineering" && variant === 4 && (
        <span className="absolute inset-0 flex items-center justify-center text-7xl font-mono italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      )}
      {catName === "Engineering" && variant === 5 && (
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          <span className="w-8 h-px" style={{ backgroundColor: palette.ink }} />
          <span className="text-6xl font-mono font-bold leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="w-8 h-px" style={{ backgroundColor: palette.ink }} />
        </div>
      )}
      {catName === "Engineering" && variant === 6 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-mono font-bold leading-none select-none" style={{ color: palette.ink }}>&lt; {initial} /&gt;</span>
          <span className="w-10 h-px mt-3" style={{ backgroundColor: palette.ink }} />
        </div>
      )}
      {catName === "Engineering" && variant === 7 && (
        <span className="absolute inset-0 flex items-center justify-center text-6xl font-mono font-bold leading-none select-none tracking-tight" style={{ color: palette.ink }}>{initial}<span className="text-3xl font-light ml-1" style={{ color: palette.wash }}>·</span></span>
      )}

      {/* ---------- Typography：字形编排 ---------- */}
      {catName === "Typography" && variant === 0 && (
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          <span className="text-7xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="text-[11px] tracking-[0.5em] font-mono select-none self-end mb-4" style={{ color: palette.ink }}>TYPO</span>
        </div>
      )}
      {catName === "Typography" && variant === 1 && (
        <span className="absolute inset-0 flex items-center justify-center text-8xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      )}
      {catName === "Typography" && variant === 2 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-7xl font-serif leading-none select-none -mb-1" style={{ color: palette.ink }}>{initial}</span>
          <span className="w-10 h-px" style={{ backgroundColor: palette.ink }} />
          <span className="text-[10px] tracking-[0.4em] font-mono select-none mt-2" style={{ color: palette.ink }}>TYPE</span>
        </div>
      )}
      {catName === "Typography" && variant === 3 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="text-7xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="w-12 h-px mt-2" style={{ backgroundColor: palette.ink }} />
        </div>
      )}
      {catName === "Typography" && variant === 4 && (
        <span className="absolute inset-0 flex items-center justify-center text-[5.5rem] font-serif font-bold leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      )}
      {catName === "Typography" && variant === 5 && (
        <div className="absolute inset-0 flex items-end justify-between px-8 py-6">
          <span className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="text-[10px] font-mono tracking-[0.4em] select-none" style={{ color: palette.ink }}>FONT</span>
        </div>
      )}
      {catName === "Typography" && variant === 6 && (
        <span className="absolute top-4 left-6 text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      )}
      {catName === "Typography" && variant === 7 && (
        <div className="absolute inset-0 flex items-center justify-center gap-3">
          <span className="text-[10px] font-mono tracking-widest select-none" style={{ color: palette.ink }}>［</span>
          <span className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="text-[10px] font-mono tracking-widest select-none" style={{ color: palette.ink }}>］</span>
        </div>
      )}

      {/* ---------- Frontend：简洁文字 ---------- */}
      {catName === "Frontend" && variant === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl font-mono leading-none select-none" style={{ color: palette.ink }}>&lt;{initial}/&gt;</span>
        </div>
      )}
      {catName === "Frontend" && variant === 1 && (
        <span className="absolute inset-0 flex items-center justify-center text-7xl font-mono font-bold leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      )}
      {catName === "Frontend" && variant === 2 && (
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          <span className="text-5xl font-mono leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="w-6 h-px" style={{ backgroundColor: palette.ink }} />
          <span className="text-[11px] tracking-widest select-none" style={{ color: palette.ink }}>UI</span>
        </div>
      )}
      {catName === "Frontend" && variant === 3 && (
        <span className="absolute inset-0 flex items-center justify-center text-6xl font-mono italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      )}
      {catName === "Frontend" && variant === 4 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-mono leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="text-[10px] tracking-[0.4em] select-none mt-2" style={{ color: palette.ink }}>FRONTEND</span>
        </div>
      )}
      {catName === "Frontend" && variant === 5 && (
        <div className="absolute inset-0 flex items-center justify-center gap-3">
          <span className="w-8 h-px" style={{ backgroundColor: palette.ink }} />
          <span className="text-6xl font-mono leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="w-8 h-px" style={{ backgroundColor: palette.ink }} />
        </div>
      )}
      {catName === "Frontend" && variant === 6 && (
        <span className="absolute bottom-6 left-6 right-6 text-6xl font-mono font-bold leading-none select-none text-center" style={{ color: palette.ink }}>{initial}</span>
      )}
      {catName === "Frontend" && variant === 7 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl font-mono leading-none select-none" style={{ color: palette.ink }}>[{initial}]</span>
        </div>
      )}

      {/* ---------- Snippet：克制排版 ---------- */}
      {catName === "Snippet" && variant === 0 && (
        <div className="absolute inset-0 flex items-center justify-center gap-3">
          <span className="w-6 h-px" style={{ backgroundColor: palette.ink }} />
          <span className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="w-6 h-px" style={{ backgroundColor: palette.ink }} />
        </div>
      )}
      {catName === "Snippet" && variant === 1 && (
        <span className="absolute inset-0 flex items-center justify-center text-7xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      )}
      {catName === "Snippet" && variant === 2 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="w-8 h-px mt-3" style={{ backgroundColor: palette.ink }} />
        </div>
      )}
      {catName === "Snippet" && variant === 3 && (
        <span className="absolute inset-0 flex items-center justify-center text-6xl font-serif leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      )}
      {catName === "Snippet" && variant === 4 && (
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          <span className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="text-sm font-light select-none" style={{ color: palette.ink }}>—</span>
        </div>
      )}
      {catName === "Snippet" && variant === 5 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] tracking-[0.5em] select-none" style={{ color: palette.ink }}>— NOTE —</span>
          <span className="text-6xl font-serif italic leading-none select-none mt-1" style={{ color: palette.ink }}>{initial}</span>
        </div>
      )}
      {catName === "Snippet" && variant === 6 && (
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <span className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="text-[10px] font-mono tracking-widest select-none" style={{ color: palette.ink }}>No.{post.id.slice(0, 4)}</span>
        </div>
      )}
      {catName === "Snippet" && variant === 7 && (
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          <span className="text-[10px] font-mono select-none" style={{ color: palette.ink }}>·</span>
          <span className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="text-[10px] font-mono select-none" style={{ color: palette.ink }}>·</span>
        </div>
      )}

      {/* ---------- Life：柔和排版 ---------- */}
      {catName === "Life" && variant === 0 && (
        <span className="absolute inset-0 flex items-center justify-center text-7xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      )}
      {catName === "Life" && variant === 1 && (
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          <span className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="text-xs tracking-widest select-none" style={{ color: palette.ink }}>生活</span>
        </div>
      )}
      {catName === "Life" && variant === 2 && (
        <span className="absolute inset-0 flex items-center justify-center text-7xl font-serif leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
      )}
      {catName === "Life" && variant === 3 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="w-8 h-px mt-3" style={{ backgroundColor: palette.ink }} />
        </div>
      )}
      {catName === "Life" && variant === 4 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl font-serif leading-none select-none" style={{ color: palette.ink }}>[ {initial} ]</span>
        </div>
      )}
      {catName === "Life" && variant === 5 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] tracking-[0.5em] select-none" style={{ color: palette.ink }}>— LIFE —</span>
          <span className="text-7xl font-serif italic leading-none select-none mt-1" style={{ color: palette.ink }}>{initial}</span>
        </div>
      )}
      {catName === "Life" && variant === 6 && (
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <span className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="text-[11px] tracking-[0.3em] select-none" style={{ color: palette.ink }}>—</span>
        </div>
      )}
      {catName === "Life" && variant === 7 && (
        <div className="absolute inset-0 flex items-center justify-center gap-3">
          <span className="w-6 h-px" style={{ backgroundColor: palette.ink }} />
          <span className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span>
          <span className="w-6 h-px" style={{ backgroundColor: palette.ink }} />
        </div>
      )}

      {/* Fallback */}
      {!isKnown && <FallbackCover initial={initial} palette={palette} variant={variant} />}
    </div>
  );
});
