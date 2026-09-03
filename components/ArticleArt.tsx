import { memo, useMemo } from "react";
import { ART_PALETTES, CAT_ABBR, resolveTagSymbol, resolveTagPrimary } from "@/lib/categories";
import type { Post } from "@/lib/types";
import type { TagSymbol } from "@/lib/categories";

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

// Fallback：8 档通用，纸感升级（保留但已微调）
function FallbackCover({ initial, palette, variant }: { initial: string; palette: any; variant: number }) {
  const F: React.JSX.Element[] = [
    <div key={0} className="absolute inset-0">
      <span className="absolute -top-6 left-6 serif italic leading-none select-none text-[8rem] tracking-tighter" style={{ color: palette.ink }}>{initial}</span>
      <span className="absolute bottom-4 right-6 block rounded-none mix-blend-multiply h-16 w-16" style={{ backgroundColor: palette.wash, border: `1px solid ${palette.ink}` }} />
      <span className="absolute bottom-5 left-6 right-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.3 }} />
      <span className="absolute bottom-7 left-6 mono text-[11px] tracking-[0.2em]" style={{ color: palette.ink }}>No. {variant}</span>
    </div>,
    <div key={1} className="absolute inset-0">
      <div className="absolute inset-4" style={{ backgroundImage: `linear-gradient(${palette.wash} 1px, transparent 1px), linear-gradient(90deg, ${palette.wash} 1px, transparent 1px)`, backgroundSize: "28px 28px", opacity: 0.55 }} />
      <span className="absolute top-1/3 left-6 h-2 w-2 rounded-none" style={{ backgroundColor: palette.ink }} />
      <span className="absolute bottom-6 right-8 h-10 w-10 rounded-none border" style={{ borderColor: palette.ink }} />
    </div>,
    <div key={2} className="absolute inset-x-8 bottom-0 top-1/4 flex items-end gap-2">
      {[34, 58, 44, 76, 62, 92].map((h, i) => (
        <span key={i} className="flex-1" style={{ height: `${h}%`, backgroundColor: i % 3 === 0 ? palette.ink : palette.wash, border: `1px solid ${palette.ink}`, borderBottom: "none" }} />
      ))}
    </div>,
    <div key={3} className="absolute inset-0">
      <span className="absolute top-6 h-20 w-20 rounded-none mix-blend-multiply left-6" style={{ backgroundColor: palette.wash }} />
      <span className="absolute top-10 h-20 w-20 rounded-none mix-blend-multiply left-1/2" style={{ backgroundColor: palette.ink, opacity: 0.22 }} />
      <span className="absolute bottom-5 left-6 right-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.45 }} />
      <span className="absolute bottom-8 left-6 serif italic text-sm" style={{ color: palette.ink }}>{initial}</span>
    </div>,
    <div key={4} className="absolute inset-0 flex items-center justify-center">
      <span className="serif italic leading-none select-none text-7xl" style={{ color: palette.ink }}>{initial}</span>
    </div>,
    <div key={5} className="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <span className="w-10 h-px" style={{ backgroundColor: palette.ink }} />
      <span className="serif italic leading-none select-none text-6xl" style={{ color: palette.ink }}>{initial}</span>
      <span className="w-10 h-px" style={{ backgroundColor: palette.ink }} />
    </div>,
    <div key={6} className="absolute inset-0 flex items-center justify-center gap-3">
      <span className="w-6 h-px" style={{ backgroundColor: palette.ink }} />
      <span className="serif italic leading-none select-none text-6xl" style={{ color: palette.ink }}>{initial}</span>
      <span className="w-6 h-px" style={{ backgroundColor: palette.ink }} />
    </div>,
    <div key={7} className="absolute inset-0 flex items-center justify-center gap-4">
      <span className="w-12 h-12 rounded-none border-2" style={{ borderColor: palette.ink }} />
      <span className="serif italic leading-none select-none text-6xl" style={{ color: palette.ink }}>{initial}</span>
      <span className="w-12 h-12 rounded-none border-2" style={{ borderColor: palette.ink }} />
    </div>,
  ];
  return F[variant] || F[0];
}

function PluginSymbol({ symbol, palette, variant, variant4 }: { symbol: TagSymbol | null; palette: any; variant: number; variant4?: number }) {
  const c = palette.ink;
  const w = palette.wash;
  const style: React.CSSProperties = { borderColor: c };
  const v = variant % 3;
  // 8×4×3=96：4点位严格四象限（右下/左下/右上/左上），3微变由 v 驱动
  const BADGE_POS = ["bottom-5 right-5", "bottom-5 left-6", "top-6 right-5", "top-6 left-6"] as const;
  const posIndex = typeof variant4 === "number" ? variant4 % 4 : variant % 4;
  const badgePos = BADGE_POS[posIndex];
  const badgeBase = `absolute ${badgePos} flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.10)]`;
  const badgeWrap = "bg-[var(--dash-card)]/90 backdrop-blur-sm border p-1.5";

  if (symbol === "grid") {
    return (
      <span className={`${badgeBase} ${badgeWrap} rounded-none`} style={{ borderColor: c }}>
        <span className="grid grid-cols-2 gap-[3px]">
          <span className="w-[12px] h-[12px] border" style={{ borderColor: c, backgroundColor: v === 1 ? w : c }} />
          <span className="w-[12px] h-[12px] border" style={{ borderColor: c, backgroundColor: v === 2 ? c : "transparent" }} />
          <span className="w-[12px] h-[12px] border" style={{ borderColor: c, backgroundColor: v === 0 ? "transparent" : w }} />
          <span className="w-[12px] h-[12px] border" style={{ borderColor: c, backgroundColor: v === 1 ? c : w }} />
        </span>
      </span>
    );
  }
  if (symbol === "shield") {
    return (
      <span className={`${badgeBase} w-9 h-10 border bg-[var(--dash-card)]/90 rounded-[3px_3px_10px_10px] flex items-center justify-center`} style={{ borderColor: c, transform: v === 2 ? "rotate(4deg)" : undefined }}>
        <span className="w-2.5 h-2.5 rounded-none" style={{ backgroundColor: c, opacity: 0.85 }} />
      </span>
    );
  }
  if (symbol === "doubleCircle") {
    return (
      <span className={`${badgeBase} w-10 h-10`}>
        <span className="absolute inset-0 h-10 w-10 rounded-none border shadow-sm" style={style} />
        <span className="absolute inset-0 h-10 w-10 rounded-none border translate-x-1 -translate-y-1 opacity-35" style={style} />
        {v === 2 && <span className="absolute inset-0 h-10 w-10 rounded-none border -translate-x-0.5 translate-y-0.5 opacity-18" style={style} />}
      </span>
    );
  }
  if (symbol === "wave") {
    return (
      <span className={`${badgeBase} gap-1.5`}>
        <span className="w-9 h-9 rounded-none border bg-[var(--dash-card)]/90 flex items-center justify-center shadow-sm" style={{ borderColor: c }}>
          <span className="w-3 h-3 rounded-none" style={{ backgroundColor: c, opacity: 0.28 }} />
        </span>
        <span className="w-8 h-8 rounded-none border bg-[var(--dash-card)]/50 -ml-2.5 shadow-sm" style={style} />
      </span>
    );
  }
  if (symbol === "diamond") {
    return (
      <span className={`${badgeBase} w-9 h-9 border bg-[var(--dash-card)]/90 rounded-none flex items-center justify-center`} style={{ ...style, transform: `rotate(${45 + v * 10}deg)` }}>
        <span className="w-3 h-3 bg-zinc-800" style={{ transform: `rotate(${-(45 + v * 10)}deg)` }} />
      </span>
    );
  }
  if (symbol === "window") {
    return (
      <span className={`${badgeBase} w-11 h-9 border rounded-[6px] bg-[var(--dash-card)]/90 overflow-hidden flex flex-col shadow-sm`} style={style}>
        <span className="h-[10px] border-b flex items-center gap-[3px] px-1.5" style={{ borderColor: c, backgroundColor: w }}>
          <span className="w-1.5 h-1.5 rounded-none" style={{ backgroundColor: c, opacity: 0.5 }} />
          <span className="w-1.5 h-1.5 rounded-none" style={{ backgroundColor: c, opacity: 0.25 }} />
        </span>
        <span className="flex-1 flex">
          <span className="flex-1 border-r" style={{ borderColor: c, opacity: 0.12 }} />
          <span className="flex-1 flex items-center justify-center text-[9px] font-medium" style={{ color: c }}>{v === 0 ? "◧" : v === 1 ? "◎" : "▭"}</span>
        </span>
      </span>
    );
  }
  if (symbol === "hex") {
    return (
      <span className={`${badgeBase} w-10 h-10 border bg-[var(--dash-card)]/80 flex items-center justify-center text-[12px] leading-none shadow-sm`} style={{ borderColor: c, clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", transform: v === 1 ? "rotate(12deg)" : undefined }}>
        {v === 2 ? "⬣" : "⬢"}
      </span>
    );
  }
  // circle fallback
  if (v === 0) return (<span className={`${badgeBase} w-10 h-10 rounded-none border bg-[var(--dash-card)]/90 shadow-sm`} style={style} />);
  if (v === 1) return (<span className={`${badgeBase} w-10 h-10 rounded-none border bg-[var(--dash-card)]/90 flex items-center justify-center shadow-sm`} style={style}><span className="w-4 h-4 rounded-none" style={{ backgroundColor: c, opacity: 0.12 }} /><span className="absolute w-2.5 h-2.5 rounded-none" style={{ backgroundColor: c }} /></span>);
  return (<span className={`${badgeBase} gap-1`}><span className="w-9 h-9 rounded-none border bg-[var(--dash-card)]/90 shadow-sm" style={style} /><span className="w-7 h-7 rounded-none border bg-[var(--dash-card)]/60 -ml-2.5 shadow-sm" style={style} /></span>);
}


// 轻纹理：纸纹 + 微噪点（克制版本，绝不堆重噪点）
function LightTexture({ palette, intensity = "low" }: { palette: any; intensity?: "low" | "mid" }) {
  const op = intensity === "low" ? 0.04 : 0.07;
  return (
    <>
      <div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 5px, ${palette.wash} 5px, ${palette.wash} 6px)`, opacity: op * 1.4 }} />
      <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, ${palette.ink} 1px, transparent 0)`, backgroundSize: "24px 24px", opacity: op }} />
    </>
  );
}

// 标签 → 主体场景：8 个独立 SVG 视觉，跟随 post.tags[0] 自动切换
// 主体区位于封面中央偏下，与左上、右下角标形成三角形呼应
function TagScene({ symbol, palette, variant }: { symbol: TagSymbol | null; palette: any; variant: number }) {
  if (!symbol) return null;
  const c = palette.ink;
  const w = palette.wash;
  const a = palette.accent;
  // 主体区统一容器：中央 + 高 56% + 宽 56%，内部 viewBox 200x120 — 内层 6s 轻微浮动，与外壳 8s 错峰
  const wrap = "absolute top-1/2 left-1/2 w-[58%] h-[58%] flex items-center justify-center cover-inner";

  if (symbol === "grid") {
    // 2x2 菜单方阵 + 中心点
    return (
      <div className={wrap}>
        <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden>
          <rect x="44" y="22" width="36" height="36" fill={w} stroke={c} strokeWidth="1.2" />
          <rect x="84" y="22" width="36" height="36" fill="transparent" stroke={c} strokeWidth="1.2" />
          <rect x="44" y="62" width="36" height="36" fill="transparent" stroke={c} strokeWidth="1.2" />
          <rect x="84" y="62" width="36" height="36" fill={c} stroke={c} strokeWidth="1.2" />
          <circle cx="124" cy="98" r="2.5" fill={a} />
          <line x1="22" y1="100" x2="178" y2="100" stroke={c} strokeWidth="0.6" opacity="0.35" />
          <text x="100" y="112" textAnchor="middle" fontSize="6" fill={c} opacity="0.5" fontFamily="JetBrains Mono">2×2 · grid</text>
        </svg>
      </div>
    );
  }
  if (symbol === "shield") {
    // 盾形 + 注入箭头被挡
    return (
      <div className={wrap}>
        <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden>
          <path d="M 100 18 L 138 28 L 138 70 Q 138 90 100 104 Q 62 90 62 70 L 62 28 Z" fill="white" stroke={c} strokeWidth="1.4" opacity="0.95" />
          <line x1="14" y1="60" x2="56" y2="60" stroke={c} strokeWidth="1" opacity="0.55" />
          <polygon points="44,60 56,52 56,68" fill={c} opacity="0.6" />
          <text x="100" y="64" textAnchor="middle" fontSize="14" fontWeight="700" fill={c} opacity="0.85">⚑</text>
          <line x1="100" y1="76" x2="100" y2="92" stroke={c} strokeWidth="0.6" opacity="0.35" />
          <line x1="86" y1="92" x2="114" y2="92" stroke={c} strokeWidth="0.6" opacity="0.35" />
        </svg>
      </div>
    );
  }
  if (symbol === "doubleCircle") {
    // 双圆叠影 + 反射波
    return (
      <div className={wrap}>
        <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden>
          <line x1="14" y1="60" x2="186" y2="60" stroke={c} strokeWidth="0.5" opacity="0.3" strokeDasharray="2 3" />
          <circle cx="74" cy="60" r="32" fill="white" stroke={c} strokeWidth="1.4" />
          <circle cx="126" cy="60" r="32" fill={w} stroke={c} strokeWidth="1.4" opacity="0.85" />
          <circle cx="74" cy="60" r="14" fill="none" stroke={c} strokeWidth="0.6" opacity="0.5" />
          <circle cx="126" cy="60" r="14" fill="none" stroke={c} strokeWidth="0.6" opacity="0.5" />
          <text x="100" y="106" textAnchor="middle" fontSize="6" fill={c} opacity="0.5" fontFamily="JetBrains Mono">mirror</text>
        </svg>
      </div>
    );
  }
  if (symbol === "wave") {
    // 层状食物 + 蒸汽 + 杯
    const layers = variant % 3;
    return (
      <div className={wrap}>
        <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden>
          {/* 杯 */}
          <path d="M 76 28 L 80 96 L 120 96 L 124 28 Z" fill="white" stroke={c} strokeWidth="1.4" />
          <line x1="74" y1="32" x2="126" y2="32" stroke={c} strokeWidth="0.8" />
          <ellipse cx="100" cy="32" rx="26" ry="4" fill={w} stroke={c} strokeWidth="1" />
          {/* 蒸汽 */}
          <path d="M 86 18 Q 90 12 86 6" stroke={c} strokeWidth="1" fill="none" opacity={layers === 0 ? 0.6 : 0.3} />
          <path d="M 100 16 Q 104 10 100 4" stroke={c} strokeWidth="1" fill="none" opacity={layers === 1 ? 0.6 : 0.3} />
          <path d="M 114 18 Q 118 12 114 6" stroke={c} strokeWidth="1" fill="none" opacity={layers === 2 ? 0.6 : 0.3} />
          {/* 层状 */}
          {layers === 0 && (
            <>
              <rect x="82" y="56" width="36" height="6" fill={a} opacity="0.7" />
              <rect x="82" y="66" width="36" height="6" fill={c} opacity="0.35" />
              <rect x="82" y="76" width="36" height="6" fill={a} opacity="0.55" />
            </>
          )}
          {layers === 1 && (
            <>
              <path d="M 82 60 Q 100 54 118 60" stroke={c} strokeWidth="1" fill="none" />
              <path d="M 82 72 Q 100 66 118 72" stroke={c} strokeWidth="1" fill="none" />
              <path d="M 82 84 Q 100 78 118 84" stroke={c} strokeWidth="1" fill="none" />
            </>
          )}
          {layers === 2 && (
            <>
              <circle cx="100" cy="62" r="6" fill={a} opacity="0.6" />
              <circle cx="100" cy="78" r="6" fill={a} opacity="0.4" />
            </>
          )}
        </svg>
      </div>
    );
  }
  if (symbol === "diamond") {
    // 大菱形 + 中心点 + 放射线
    return (
      <div className={wrap}>
        <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x2 = 100 + Math.cos(angle) * 70;
            const y2 = 60 + Math.sin(angle) * 42;
            return <line key={i} x1="100" y1="60" x2={x2} y2={y2} stroke={c} strokeWidth="0.4" opacity="0.3" />;
          })}
          <polygon points="100,22 142,60 100,98 58,60" fill={w} stroke={c} strokeWidth="1.4" />
          <polygon points="100,38 124,60 100,82 76,60" fill="none" stroke={c} strokeWidth="0.8" opacity="0.6" />
          <circle cx="100" cy="60" r="3.5" fill={c} />
          <circle cx="100" cy="60" r="1.5" fill={a} />
          <text x="100" y="112" textAnchor="middle" fontSize="6" fill={c} opacity="0.5" fontFamily="JetBrains Mono">soulsync</text>
        </svg>
      </div>
    );
  }
  if (symbol === "window") {
    // 打印窗口 + 纸出来
    return (
      <div className={wrap}>
        <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden>
          <rect x="50" y="20" width="100" height="64" rx="3" fill="white" stroke={c} strokeWidth="1.4" />
          <rect x="50" y="20" width="100" height="12" fill={w} stroke={c} strokeWidth="1" />
          <circle cx="58" cy="26" r="1.5" fill={c} opacity="0.6" />
          <circle cx="64" cy="26" r="1.5" fill={c} opacity="0.4" />
          <circle cx="70" cy="26" r="1.5" fill={c} opacity="0.3" />
          {/* 内容行 */}
          <line x1="60" y1="42" x2="120" y2="42" stroke={c} strokeWidth="0.6" opacity="0.3" />
          <line x1="60" y1="50" x2="110" y2="50" stroke={c} strokeWidth="0.6" opacity="0.3" />
          <line x1="60" y1="58" x2="130" y2="58" stroke={c} strokeWidth="0.6" opacity="0.3" />
          <line x1="60" y1="66" x2="100" y2="66" stroke={c} strokeWidth="0.6" opacity="0.3" />
          <line x1="60" y1="74" x2="118" y2="74" stroke={c} strokeWidth="0.6" opacity="0.3" />
          {/* 纸出 */}
          <path d="M 96 84 L 96 102 L 110 102 L 110 84" fill="white" stroke={c} strokeWidth="1" />
          <line x1="98" y1="90" x2="108" y2="90" stroke={c} strokeWidth="0.4" opacity="0.5" />
          <line x1="98" y1="94" x2="108" y2="94" stroke={c} strokeWidth="0.4" opacity="0.5" />
        </svg>
      </div>
    );
  }
  if (symbol === "hex") {
    // 大六边 + 内部连点
    const nodes = [[100, 30], [70, 60], [130, 60], [100, 90], [55, 60], [145, 60]];
    const edges = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [1, 4], [2, 5]];
    return (
      <div className={wrap}>
        <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden>
          {edges.map(([a, b], i) => {
            const na = nodes[a], nb = nodes[b];
            return <line key={i} x1={na[0]} y1={na[1]} x2={nb[0]} y2={nb[1]} stroke={c} strokeWidth="0.6" opacity="0.45" />;
          })}
          {nodes.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3" fill="white" stroke={c} strokeWidth="1" />
          ))}
          <polygon points="100,30 130,46 130,76 100,92 70,76 70,46" fill="none" stroke={c} strokeWidth="1" opacity="0.35" strokeDasharray="3 3" />
          <circle cx="100" cy="60" r="2" fill={a} />
        </svg>
      </div>
    );
  }
  // circle fallback：同心圆 + 中心点 + 外环点
  return (
    <div className={wrap}>
      <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden>
        <circle cx="100" cy="60" r="38" fill="none" stroke={c} strokeWidth="0.6" opacity="0.4" strokeDasharray="2 3" />
        <circle cx="100" cy="60" r="24" fill="none" stroke={c} strokeWidth="0.8" opacity="0.55" />
        <circle cx="100" cy="60" r="12" fill={w} stroke={c} strokeWidth="1" />
        <circle cx="100" cy="60" r="3" fill={c} />
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i * 60 * Math.PI) / 180;
          return <circle key={i} cx={100 + Math.cos(a) * 38} cy={60 + Math.sin(a) * 38} r="1.5" fill={c} opacity="0.6" />;
        })}
      </svg>
    </div>
  );
}

export const ArticleArt = memo(function ArticleArt({
  post,
  tall = false,
}: {
  post: Post;
  tall?: boolean;
}) {
  const rawCatName = getCategoryName(post.category);
  const KNOWN = ["Design", "Plugin", "Engineering", "Typography", "Frontend", "Snippet", "Life"];
  const isRawKnown = KNOWN.includes(rawCatName);
  // 未知分类 hash 进 7 族（无灰色兜底），空分类才用通用纸
  const effectiveCat = isRawKnown ? rawCatName : rawCatName ? KNOWN[hashVariant(rawCatName, KNOWN.length)] : "";
  const catName = effectiveCat || rawCatName;
  const palette =
    (ART_PALETTES as any)[effectiveCat] ||
    (ART_PALETTES as any)[catName] ||
    (ART_PALETTES as any)[(post.category as any)] || { paper: "#F8F7F4", ink: "#2B2926", wash: "#E8E2DA", accent: "#C9A98A" };
  const variantSeed = (post.title || "") + catName + (post.id || "") + (post.tags?.join(",") || "");
  const variant = useMemo(() => hashVariant(variantSeed, 8), [variantSeed]);
  const variant4 = useMemo(() => hashVariant(variantSeed + "4", 4), [variantSeed]);
  const variant3 = useMemo(() => hashVariant(variantSeed + "3", 3), [variantSeed]);
  const initial = (post.title || "A").charAt(0);
  const abbr = (CAT_ABBR as any)[catName] || (CAT_ABBR as any)[effectiveCat] || catName.slice(0, 3).toUpperCase() || "GEN";
  const noNum = useMemo(() => String(hashVariant(post.id || post.title || "0", 9000) + 1000).padStart(4, "0"), [post.id, post.title]);
  const symbol = useMemo(() => resolveTagSymbol((post as any).tags), [(post as any).tags]);
  const tagPrimary = useMemo(() => resolveTagPrimary((post as any).tags), [(post as any).tags]);
  const isKnown = !!effectiveCat || isRawKnown;

  const shiftClass = useMemo(() => {
    if (variant <= 2) return "left-6";
    if (variant <= 4) return "left-[32%]";
    if (variant === 5) return "left-[48%]";
    if (variant === 6) return "right-14";
    return "right-6";
  }, [variant]);

  const gridSize = variant % 2 === 0 ? "24px" : "28px";
  const dotPos = ["left-[22%]", "left-[38%]", "left-[52%]", "left-[64%]"][variant4] || "left-[38%]";

  return (
    <div
      aria-hidden="true"
      className={`group relative w-full overflow-hidden rounded-none border border-[var(--yh-border)] cover cover-loop ${tall ? "aspect-[4/5]" : "aspect-[4/3]"}`}
      style={{ backgroundColor: palette.paper }}
    >
      {/* 纸纹 + 微噪点 */}
      <div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${palette.wash} 3px, ${palette.wash} 4px)`, opacity: catName === "Design" ? 0.20 : catName === "Plugin" ? 0.12 : 0.15 }} />
      <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, ${palette.ink} 1px, transparent 0)`, backgroundSize: "20px 20px" }} />
      {/* 顶部细发丝线（编辑感） */}
      <div className="absolute top-0 left-6 right-6 h-px opacity-[0.07]" style={{ backgroundColor: palette.ink }} />

      {/* 标签 → 主体场景区（位于中央偏下，与右下角标形成呼应） */}
      <TagScene symbol={symbol as TagSymbol | null} palette={palette} variant={variant} />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 mono text-[8px] tracking-[0.2em] opacity-40" style={{ color: palette.ink }}>{tagPrimary ? tagPrimary.toUpperCase() : abbr}</div>

      {/* ---------- Design：编辑杂志感 · v2：族徽+轻纹理+5-7元素 ---------- */}
      {catName === "Design" && (
        <>
          <LightTexture palette={palette} intensity="low" />
          {variant3 === 0 && (
            <>
              <span className={`absolute -top-4 serif italic leading-none select-none tracking-tighter ${shiftClass} ${tall ? "text-[10.5rem]" : "text-[7.8rem]"}`} style={{ color: palette.ink, fontWeight: 300 }}>{initial}</span>
              <span className="absolute left-6 top-6 bottom-10 w-px opacity-20" style={{ backgroundColor: palette.ink }} />
              <span className="absolute left-[26px] top-6 mono text-[7px] tracking-[0.2em]" style={{ color: palette.ink, writingMode: "vertical-rl" as any }}>EDITION · {noNum}</span>
              <span className={`absolute bottom-4 right-6 block rounded-none mix-blend-multiply shadow-sm ${tall ? "h-20 w-20" : "h-14 w-14"}`} style={{ background: `radial-gradient(circle at 30% 30%, ${palette.wash}, ${palette.paper})`, border: `1px solid ${palette.ink}` }} />
              <span className={`absolute top-3 ${dotPos} w-1 h-1 rounded-none`} style={{ backgroundColor: palette.accent }} />
              <span className="absolute -bottom-1 right-10 w-10 h-[2px] opacity-20" style={{ backgroundColor: palette.ink }} />
              <span className="absolute bottom-5 left-6 right-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.18 }} />
              <span className="absolute bottom-[26px] left-6 mono text-[10px] tracking-[0.2em] select-none" style={{ color: palette.ink }}>{abbr} · {noNum} — · ED.</span>
              <PluginSymbol symbol={symbol as any} palette={palette} variant={variant} variant4={variant4} />
            </>
          )}
          {variant3 === 1 && (
            <>
              <span className={`absolute -top-2 serif italic leading-none select-none ${shiftClass} ${tall ? "text-[9.5rem]" : "text-[6.8rem]"}`} style={{ color: palette.ink, letterSpacing: "-0.04em", fontWeight: 300 }}>{initial}</span>
              <span className="absolute inset-6 border opacity-10 rounded-[10px]" style={{ borderColor: palette.ink }} />
              <span className="absolute bottom-4 right-7 w-12 h-12 rounded-none border shadow-sm" style={{ borderColor: palette.ink, background: `radial-gradient(circle at 35% 35%, white, ${palette.wash})` }} />
              <span className="absolute bottom-4 right-7 w-12 h-12 rounded-none border translate-x-1 -translate-y-1 opacity-25" style={{ borderColor: palette.ink }} />
              <span className="absolute top-6 right-6 mono text-[7px] tracking-[0.2em] border px-1.5 py-0.5 rounded-none" style={{ borderColor: palette.ink, color: palette.ink, opacity: 0.6 }}>VOL. {noNum.slice(0,2)}</span>
              <span className={`absolute top-3 ${dotPos} w-1 h-1 rounded-none opacity-60`} style={{ backgroundColor: palette.ink }} />
              <span className="absolute bottom-5 left-6 right-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.18 }} />
              <span className="absolute bottom-[26px] left-6 mono text-[10px] tracking-[0.2em] select-none" style={{ color: palette.ink }}>{abbr} · {noNum} ◇ · ED.</span>
              <PluginSymbol symbol={symbol as any} palette={palette} variant={variant} variant4={variant4} />
            </>
          )}
          {variant3 === 2 && (
            <>
              <span className="absolute top-0 left-0 right-0 h-[36%] opacity-[0.06]" style={{ background: `linear-gradient(180deg, ${palette.wash}, transparent)` }} />
              <span className="absolute top-7 left-6 right-6 flex items-center gap-3">
                <span className="h-px flex-1" style={{ backgroundColor: palette.ink, opacity: 0.18 }} />
                <span className="serif italic text-2xl tracking-tight" style={{ color: palette.ink }}>{initial}</span>
                <span className="mono text-[8px] tracking-[0.2em] border px-2 py-0.5 rounded-none" style={{ borderColor: palette.ink, opacity: 0.35, color: palette.ink }}>{abbr}</span>
                <span className="h-px flex-1" style={{ backgroundColor: palette.ink, opacity: 0.18 }} />
              </span>
              <span className="absolute bottom-0 left-0 right-0 h-[28%] opacity-40" style={{ background: `radial-gradient(ellipse at 75% 100%, ${palette.wash} 0%, transparent 65%)` }} />
              <span className="absolute bottom-4 right-6 w-11 h-11 rounded-none shadow-sm flex items-center justify-center mono text-[8px]" style={{ backgroundColor: variant % 2 === 0 ? palette.wash : "white", border: `1px solid ${palette.ink}`, color: palette.ink }}>{noNum.slice(-2)}</span>
              <span className={`absolute top-3 ${dotPos} w-1 h-1 rounded-none`} style={{ backgroundColor: palette.accent, opacity: 0.8 }} />
              <span className="absolute bottom-5 left-6 right-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.18 }} />
              <span className="absolute bottom-[26px] left-6 mono text-[10px] tracking-[0.2em] select-none" style={{ color: palette.ink }}>{abbr} · {noNum} ◇ · ED.</span>
              <PluginSymbol symbol={symbol as any} palette={palette} variant={variant} variant4={variant4} />
            </>
          )}
        </>
      )}

      {/* ---------- Plugin：系统网格 + 轨道 + 族徽（v2） ---------- */}
      {catName === "Plugin" && (
        <>
          <LightTexture palette={palette} intensity="low" />
          <div className="absolute inset-4 rounded-[8px] border opacity-30" style={{ borderColor: palette.wash, backgroundImage: `linear-gradient(${palette.wash} 1px, transparent 1px), linear-gradient(90deg, ${palette.wash} 1px, transparent 1px)`, backgroundSize: `${gridSize} ${gridSize}` }} />
          <span className="absolute top-[18px] left-[18px] mono text-[6px] tracking-[0.12em] opacity-30" style={{ color: palette.ink }}>00 — 04 — 08</span>
          {variant3 === 0 && (
            <>
              <span className="absolute top-[34%] left-6 right-10 h-px" style={{ backgroundColor: palette.ink, opacity: 0.28 }} />
              <span className={`absolute top-[31%] ${dotPos} h-2 w-2 rotate-45 shadow-sm`} style={{ backgroundColor: palette.ink, borderRadius: variant % 3 === 0 ? "9999px" : "1px" }} />
              {variant % 2 === 0 && <span className="absolute top-[46%] left-6 right-16 h-px opacity-12" style={{ backgroundColor: palette.ink }} />}
              <span className="absolute top-6 right-6 w-1 h-1 rounded-none opacity-40" style={{ backgroundColor: palette.accent }} />
            </>
          )}
          {variant3 === 1 && (
            <>
              <span className="absolute top-[28%] left-6 right-10 h-px" style={{ backgroundColor: palette.ink, opacity: 0.22 }} />
              <span className={`absolute top-[25%] ${dotPos} h-1.5 w-1.5 rounded-none shadow-sm`} style={{ backgroundColor: palette.accent, boxShadow: `0 0 0 3px ${palette.wash}` }} />
              <span className="absolute left-[22%] top-6 bottom-10 w-px opacity-12" style={{ backgroundColor: palette.ink }} />
            </>
          )}
          {variant3 === 2 && (
            <>
              <span className="absolute top-6 left-6 w-6 h-6 border-l border-t rounded-tl-[6px]" style={{ borderColor: palette.ink, opacity: 0.22 }} />
              <span className="absolute bottom-10 right-10 w-6 h-6 border-r border-b rounded-br-[6px]" style={{ borderColor: palette.ink, opacity: 0.16 }} />
              <span className={`absolute top-[31%] ${dotPos} h-2 w-2 shadow-sm`} style={{ backgroundColor: palette.ink, borderRadius: "9999px", boxShadow: `0 0 0 4px ${palette.wash}` }} />
              <span className="absolute top-[34%] left-6 right-10 h-px" style={{ backgroundColor: palette.ink, opacity: 0.18 }} />
            </>
          )}
          <span className="absolute bottom-6 left-6 mono text-[10px] tracking-[0.18em] select-none flex items-center gap-1.5" style={{ color: palette.ink }}>
            <span>{abbr} · {noNum}</span>
            <span className="opacity-40">·</span>
            <span className="opacity-70">{symbol ? symbol : "plug"}</span>
          </span>
          <PluginSymbol symbol={symbol as any} palette={palette} variant={variant} variant4={variant4} />
        </>
      )}

      {/* ---------- Engineering：蓝图感 · v2：族徽+轻纹理 ---------- */}
      {catName === "Engineering" && (
        <>
          <LightTexture palette={palette} intensity="low" />
          {variant3 === 0 && (
            <>
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 180" preserveAspectRatio="none" aria-hidden>
                <path d="M0 78 L58 60 L118 86 L182 42 L242 71 L320 52" fill="none" stroke={palette.wash} strokeWidth="1.2" />
                <path d="M0 98 L78 90 L138 104 L198 72 L320 82" fill="none" stroke={palette.ink} strokeWidth="0.65" strokeDasharray="5 5" opacity="0.32" />
                <g opacity="0.35"><line x1="58" y1="60" x2="58" y2="12" stroke={palette.ink} strokeWidth="0.5" strokeDasharray="2 3"/><text x="60" y="10" fontSize="6" fill={palette.ink} fontFamily="JetBrains Mono">EL.58</text></g>
              </svg>
              <span className={`absolute top-[34%] ${dotPos} w-1.5 h-1.5 rounded-none`} style={{ backgroundColor: palette.accent }} />
              <span className="absolute top-6 left-6 mono text-[6px] tracking-[0.15em] border px-1.5 py-0.5 rounded bg-[var(--dash-card)]/80" style={{ borderColor: palette.ink, opacity: 0.35, color: palette.ink }}>CONTOUR · {dotPos.replace(/[^0-9]/g,'')}</span>
              <span className="absolute bottom-6 right-7 w-8 h-8 rounded-none border opacity-60 shadow-sm" style={{ borderColor: palette.ink, background: `radial-gradient(circle at 30% 30%, white, ${palette.wash})` }} />
              <PluginSymbol symbol={symbol as any} palette={palette} variant={variant} variant4={variant4} />
            </>
          )}
          {variant3 === 1 && (
            <>
              <div className="absolute inset-4 rounded-[8px] border" style={{ borderColor: palette.wash, backgroundImage: `linear-gradient(${palette.wash} 1px, transparent 1px), linear-gradient(90deg, ${palette.wash} 1px, transparent 1px)`, backgroundSize: `22px 22px`, opacity: variant % 2 === 0 ? 0.42 : 0.28 }} />
              <div className="absolute top-7 left-6 flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-none animate-pulse" style={{ backgroundColor: palette.accent }} />
                <span className="mono text-[7px] tracking-[0.15em]" style={{ color: palette.ink }}>3 NODES · {dotPos === "left-[22%]" ? "A" : dotPos === "left-[38%]" ? "B" : dotPos === "left-[52%]" ? "C" : "D"}</span>
              </div>
              <span className={`absolute top-1/2 ${dotPos} w-1 h-1 rounded-none opacity-40`} style={{ backgroundColor: palette.ink }} />
              <span className="absolute bottom-6 right-8 w-9 h-9 border flex items-center justify-center text-[10px] shadow-sm bg-[var(--dash-card)]/70" style={{ borderColor: palette.ink, clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", transform: variant % 2 === 0 ? "rotate(12deg)" : undefined }}>⬢</span>
              <PluginSymbol symbol={symbol as any} palette={palette} variant={variant} variant4={variant4} />
            </>
          )}
          {variant3 === 2 && (
            <>
              <svg className="absolute inset-0 w-full h-full opacity-45" viewBox="0 0 320 180" aria-hidden>
                <rect x="34" y="36" width="68" height="42" fill="white" stroke={palette.ink} strokeWidth="0.9" rx="3" />
                <rect x="118" y="54" width="68" height="42" fill="white" stroke={palette.wash} strokeWidth="0.9" rx="3" />
                <line x1="102" y1="58" x2="118" y2="76" stroke={palette.ink} strokeWidth="0.75" opacity="0.4"/>
                <circle cx={variant4 % 2 === 0 ? 52 : 126} cy={variant4 % 2 === 0 ? 44 : 62} r="2.2" fill={palette.accent} />
                <text x="38" y="48" fontSize="6" fill={palette.ink} opacity="0.5" fontFamily="JetBrains Mono">ARCH-0{variant4 + 2}</text>
              </svg>
              <span className="absolute top-6 right-6 mono text-[6px] tracking-[0.15em] opacity-30" style={{ color: palette.ink }}>SCALE 1:2{variant4}0</span>
              <PluginSymbol symbol={symbol as any} palette={palette} variant={variant} variant4={variant4} />
            </>
          )}
          <span className="absolute bottom-6 left-6 mono text-[10px] tracking-[0.18em] select-none" style={{ color: palette.ink }}>{abbr} · {noNum} {variant % 2 ? "⬢" : "—"} · {variant4}</span>
        </>
      )}

      {/* ---------- Frontend：窗口 chrome · v2：族徽+轻纹理+5-7元素 ---------- */}
      {catName === "Frontend" && (
        <>
          <LightTexture palette={palette} intensity="low" />
          {variant3 === 0 && (
            <>
              {/* 1. 浏览器窗口 */}
              <span className="absolute top-7 left-7 right-7 h-[54%] border rounded-[10px] bg-[var(--dash-card)]/85 overflow-hidden shadow-sm" style={{ borderColor: palette.wash }}>
                {/* 2. chrome 控件 */}
                <span className="absolute top-0 left-0 right-0 h-[16px] border-b flex items-center gap-1.5 px-2.5" style={{ borderColor: palette.wash, backgroundColor: palette.paper }}>
                  <span className="w-2 h-2 rounded-none" style={{ backgroundColor: "#E8AFAF" }} />
                  <span className="w-2 h-2 rounded-none" style={{ backgroundColor: "#E8D9A0" }} />
                  <span className="w-2 h-2 rounded-none" style={{ backgroundColor: "#A8D8B0" }} />
                  <span className="ml-2 flex-1 h-2 rounded-none opacity-40" style={{ backgroundColor: palette.wash }} />
                  <span className={`ml-1 w-1.5 h-1.5 rounded-none ${variant4 === 0 ? "opacity-100" : "opacity-30"}`} style={{ backgroundColor: palette.accent }} />
                </span>
                {/* 3. 内容行 1 */}
                <span className="absolute top-[24px] left-3 right-3 h-1.5 rounded-none" style={{ backgroundColor: palette.ink, opacity: 0.15, width: `${60 + variant4 * 6}%` }} />
                {/* 4. 内容行 2 */}
                <span className="absolute top-[36px] left-3 h-1.5 rounded-none" style={{ backgroundColor: palette.wash, width: `${70 + variant4 * 4}%` }} />
                {/* 5. 内容行 3 */}
                <span className="absolute top-[46px] left-3 h-1.5 rounded-none" style={{ backgroundColor: palette.wash, opacity: 0.7, width: `${50 + variant4 * 5}%` }} />
                {/* 6. 状态栏 */}
                <span className="absolute bottom-2 left-3 right-3 h-1.5 rounded-none" style={{ backgroundColor: palette.accent, opacity: 0.28 }} />
                {/* 7. URL 标签 */}
                <span className="absolute top-2 right-2 mono text-[6px] opacity-40" style={{ color: palette.ink }}>localhost:3000</span>
              </span>
              {/* 8. 底栏 */}
              <span className="absolute bottom-6 left-6 mono text-[10px] tracking-[0.18em]" style={{ color: palette.ink }}>FRT · {noNum} ▭ WIN</span>
              <PluginSymbol symbol={symbol as any} palette={palette} variant={variant} variant4={variant4} />
            </>
          )}
          {variant3 === 1 && (
            <>
              {/* 1. 3 列栅格 */}
              <div className="absolute top-7 left-7 right-7 bottom-12 grid grid-cols-3 gap-2">
                <span className="border rounded-[8px] bg-[var(--dash-card)]/70 shadow-sm p-1.5 overflow-hidden" style={{ borderColor: variant4 % 2 === 0 ? palette.wash : palette.ink }}>
                  <span className="block h-1 rounded-none w-3/4 mb-1.5" style={{ backgroundColor: palette.wash }} />
                  <span className="block h-8 rounded bg-[var(--dash-card)] border" style={{ borderColor: palette.wash }} />
                </span>
                <span className="border rounded-[8px] bg-[var(--dash-card)]/70 shadow-sm p-1.5" style={{ borderColor: palette.wash }}>
                  <span className="block h-1 rounded-none w-2/3 mb-1.5" style={{ backgroundColor: palette.wash }} />
                  <span className="block h-8 rounded bg-[var(--dash-card)] border" style={{ borderColor: palette.wash }} />
                </span>
                <span className="border rounded-[8px] flex flex-col items-center justify-center shadow-sm" style={{ borderColor: palette.ink, backgroundColor: variant4 <= 1 ? palette.ink : palette.accent }}>
                  <span className="w-6 h-6 rounded-none bg-[var(--dash-card)]/90 flex items-center justify-center text-[10px]">{variant4 <= 1 ? "↗" : "→"}</span>
                  <span className="mono text-[7px] tracking-[0.15em] text-white mt-1">{variant4 <= 1 ? "GO" : "OK"}</span>
                </span>
              </div>
              {/* 2. 状态点 */}
              <span className="absolute top-3 left-3 w-1.5 h-1.5 rounded-none" style={{ backgroundColor: palette.accent }} />
              {/* 3. 状态文字 */}
              <span className="absolute bottom-7 left-7 mono text-[10px] tracking-[0.18em]" style={{ color: palette.ink }}>FRT · {noNum} ⊞ GRID</span>
              {/* 4. 4. 5. 装饰点 */}
              <span className="absolute bottom-7 right-7 w-1 h-1 rounded-none" style={{ backgroundColor: palette.ink, opacity: 0.4 }} />
              <span className="absolute bottom-9 right-9 w-1 h-1 rounded-none" style={{ backgroundColor: palette.ink, opacity: 0.3 }} />
              <PluginSymbol symbol={symbol as any} palette={palette} variant={variant} variant4={variant4} />
            </>
          )}
          {variant3 === 2 && (
            <>
              {/* 1. 顶部徽标 */}
              <span className={`absolute top-7 mono text-[11px] tracking-[0.28em] ${shiftClass} border px-2 py-0.5 rounded-none bg-[var(--dash-card)] shadow-sm`} style={{ color: palette.ink, borderColor: palette.wash, opacity: variant % 2 === 0 ? 1 : 0.85 }}>frontend · No.{noNum}</span>
              {/* 2. 角点 */}
              <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-none" style={{ backgroundColor: palette.accent }} />
              {/* 3. 巨字 */}
              <span className="absolute bottom-8 left-7 serif italic text-2xl tracking-tight" style={{ color: palette.ink }}>{initial}</span>
              {/* 4. 字号标 */}
              <span className="absolute bottom-7 left-16 mono text-[8px] tracking-[0.15em] opacity-40" style={{ color: palette.ink }}>Aa · {12 + variant4 * 2}px</span>
              {/* 5. 度量小格 */}
              <span className="absolute bottom-7 right-16 flex gap-0.5">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="w-1.5 h-3" style={{ backgroundColor: i <= variant4 ? palette.ink : palette.wash, opacity: i <= variant4 ? 0.8 : 0.5 }} />
                ))}
              </span>
              {/* 6. 底分割线 */}
              <span className="absolute bottom-6 left-6 right-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.18 }} />
              {/* 7. 类别小标 */}
              <span className="absolute bottom-[26px] right-6 mono text-[10px] tracking-[0.18em]" style={{ color: palette.ink }}>FRT · {noNum} COMP</span>
              <PluginSymbol symbol={symbol as any} palette={palette} variant={variant} variant4={variant4} />
            </>
          )}
        </>
      )}

      {/* ---------- Snippet：便签质感 · v2：族徽+轻纹理 ---------- */}
      {catName === "Snippet" && (
        <>
          <LightTexture palette={palette} intensity="low" />
          {variant3 === 0 && (
            <>
              <span className="absolute top-5 left-6 right-6 bottom-10 bg-[var(--dash-card)] rounded-[6px] shadow-sm border" style={{ borderColor: palette.wash, transform: `rotate(${variant4 % 2 === 0 ? -0.4 : 0.4}deg)` }} />
              <span className={`absolute top-5 w-5 h-5 bg-[var(--dash-card)] border shadow-sm rotate-45 translate-x-2 -translate-y-2 ${dotPos === "left-[22%]" ? "right-14" : dotPos === "left-[38%]" ? "right-10" : dotPos === "left-[52%]" ? "right-6" : "right-8"}`} style={{ borderColor: palette.wash }} />
              <span className="absolute top-8 left-8 right-10 h-px" style={{ backgroundColor: palette.wash, opacity: 0.9 - variant4 * 0.15 }} />
              <span className="absolute top-11 left-8 right-12 h-px opacity-60" style={{ backgroundColor: palette.wash }} />
              <span className="absolute top-14 left-8 h-px opacity-40" style={{ backgroundColor: palette.wash, width: `${68 + variant4 * 4}%` }} />
              <span className="absolute bottom-7 right-10 mono text-[7px] tracking-[0.15em] rotate-[-4deg] border px-1 py-0.5 rounded bg-amber-50 shadow-sm" style={{ borderColor: palette.wash, color: palette.ink, transform: `rotate(${-4 + variant4}deg)` }}>TAPE · {variant4}</span>
              <PluginSymbol symbol={symbol as any} palette={palette} variant={variant} variant4={variant4} />
            </>
          )}
          {variant3 === 1 && (
            <>
              <span className="absolute top-6 left-6 right-6 bottom-10 bg-[var(--dash-card)]/90 rounded-[8px] border p-3 shadow-sm" style={{ borderColor: palette.wash }}>
                <span className="flex items-center gap-2 mb-2"><span className="w-3 h-3 rounded border flex items-center justify-center" style={{ borderColor: variant4 <= 1 ? palette.accent : palette.ink, backgroundColor: variant4 <= 1 ? palette.accent : "transparent", opacity: variant4 <= 1 ? 1 : 0.4 }}><span className="text-white text-[8px] leading-none" style={{ opacity: variant4 <= 1 ? 1 : 0 }}>✓</span></span><span className="h-1.5 rounded-none" style={{ backgroundColor: palette.ink, opacity: 0.18, width: `${14 + variant4 * 2}rem` }} /><span className="ml-auto mono text-[7px] tracking-[0.15em] opacity-40" style={{ color: palette.ink }}>{variant4 <= 1 ? "DONE" : "TODO"}</span></span>
                <span className="flex items-center gap-2 mb-2"><span className="w-3 h-3 rounded border" style={{ borderColor: palette.ink, opacity: variant4 <= 2 ? 0.4 : 0.15 }} /><span className="h-1.5 w-12 rounded-none" style={{ backgroundColor: palette.wash, opacity: 0.7 - variant4 * 0.1 }} /></span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded border" style={{ borderColor: palette.ink, opacity: 0.2 }} /><span className="h-1.5 rounded-none" style={{ backgroundColor: palette.wash, opacity: 0.55, width: `${5 + variant4}rem` }} /></span>
              </span>
              <span className={`absolute top-6 ${dotPos} w-1.5 h-1.5 rounded-none opacity-40`} style={{ backgroundColor: palette.accent }} />
              <PluginSymbol symbol={symbol as any} palette={palette} variant={variant} variant4={variant4} />
            </>
          )}
          {variant3 === 2 && (
            <>
              <span className="absolute top-6 left-6 right-6 bottom-10 bg-[var(--dash-card)] rounded-[8px] border shadow-sm" style={{ borderColor: palette.wash }} />
              <span className="absolute left-10 top-6 bottom-10 w-px" style={{ backgroundColor: variant4 % 2 === 0 ? palette.accent : palette.wash, opacity: variant4 % 2 === 0 ? 0.32 : 0.18 }} />
              <span className="absolute left-10 top-6 w-1 h-1 rounded-none -translate-x-0.5" style={{ backgroundColor: variant4 % 2 === 0 ? palette.accent : palette.ink }} />
              <span className="absolute top-8 left-12 right-8 h-px" style={{ backgroundColor: palette.wash, width: `${82 - variant4 * 4}%` }} />
              <span className="absolute top-11 left-12 right-10 h-px opacity-60" style={{ backgroundColor: palette.wash }} />
              <span className="absolute top-14 left-12 right-12 h-px opacity-35" style={{ backgroundColor: palette.wash }} />
              <span className="absolute top-6 right-10 mono text-[6px] tracking-[0.15em] opacity-40" style={{ color: palette.ink }}>RULED · {variant4}</span>
              <PluginSymbol symbol={symbol as any} palette={palette} variant={variant} variant4={variant4} />
            </>
          )}
          <span className="absolute bottom-6 left-6 mono text-[10px] tracking-[0.18em]" style={{ color: palette.ink }}>{abbr} · {noNum} — · {variant4}</span>
          <span className="absolute bottom-6 right-6 w-2 h-2 rounded-none opacity-50" style={{ backgroundColor: variant % 2 === 0 ? palette.accent : palette.ink }} />
        </>
      )}

      {/* ---------- Life：有机水彩 · v2：族徽+轻纹理+5-7元素 ---------- */}
      {catName === "Life" && (
        <>
          <LightTexture palette={palette} intensity="low" />
          {variant3 === 0 && (
            <>
              <span className="absolute -top-6 -right-8 w-32 h-32 rounded-none" style={{ background: `radial-gradient(circle at 40% 40%, ${palette.wash}, transparent 65%)`, opacity: 0.35 + variant4 * 0.05 }} />
              <span className="absolute -bottom-4 -left-6 w-20 h-20 rounded-none" style={{ background: `radial-gradient(circle at 60% 60%, ${palette.accent}, transparent 60%)`, opacity: 0.18 }} />
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 180" preserveAspectRatio="none" aria-hidden>
                <path d="M 10 102 Q 80 62 160 102 T 310 102" fill="none" stroke={palette.ink} strokeWidth="1.1" opacity={0.18 + variant4 * 0.02} />
                <path d="M 10 122 Q 80 82 160 122 T 310 122" fill="none" stroke={palette.wash} strokeWidth="1.6" opacity="0.9" />
                <path d="M 10 142 Q 80 102 160 142 T 310 142" fill="none" stroke={palette.wash} strokeWidth="1" opacity="0.55" strokeDasharray="3 4" />
              </svg>
              <circle cx={42 + variant4 * 8} cy={36 + variant4 * 2} r="2.2" fill={palette.accent} opacity="0.9" />
              <circle cx={84 - variant4 * 4} cy={46} r="1.2" fill={palette.ink} opacity="0.15" />
              <span className="absolute top-7 right-6 mono text-[7px] tracking-[0.15em] border px-1.5 py-0.5 rounded-none bg-[var(--dash-card)] shadow-sm" style={{ borderColor: palette.wash, color: palette.ink }}>FIELD · {variant4}</span>
              <span className="absolute bottom-7 left-6 mono text-[10px] tracking-[0.18em]" style={{ color: palette.ink }}>LIFE · {noNum} 〜</span>
              <span className="absolute bottom-6 left-6 right-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.18 }} />
              <PluginSymbol symbol={symbol as any} palette={palette} variant={variant} variant4={variant4} />
            </>
          )}
          {variant3 === 1 && (
            <>
              <span className="absolute top-7 left-7 w-16 h-16 rounded-none border shadow-sm" style={{ borderColor: palette.wash, background: `radial-gradient(circle at 35% 35%, white, ${palette.wash})`, transform: `translateX(${variant4 * 2}px)` }} />
              <span className="absolute top-12 left-12 w-16 h-16 rounded-none border -ml-6 opacity-45 shadow-sm" style={{ borderColor: palette.ink, backgroundColor: "white", transform: `translateX(${-variant4}px)` }} />
              <span className={`absolute top-[40%] ${dotPos} w-2 h-2 rounded-none shadow-sm`} style={{ backgroundColor: palette.accent }} />
              <span className={`absolute top-[40%] ${dotPos} w-2 h-2 rounded-none animate-ping opacity-15`} style={{ backgroundColor: palette.accent }} />
              <span className="absolute bottom-10 left-6 right-6 h-px" style={{ backgroundColor: palette.wash, opacity: 0.5 + variant4 * 0.1 }} />
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="absolute bottom-9" style={{ left: `${25 + i * 16}%`, width: 1, height: 4, backgroundColor: palette.ink, opacity: 0.3 }} />
              ))}
              <span className="absolute bottom-7 left-6 mono text-[10px] tracking-[0.18em]" style={{ color: palette.ink }}>LIFE · {noNum} ~</span>
              <span className="absolute bottom-7 right-6 mono text-[9px] opacity-50" style={{ color: palette.ink }}>DAILY · {variant4}</span>
              <PluginSymbol symbol={symbol as any} palette={palette} variant={variant} variant4={variant4} />
            </>
          )}
          {variant3 === 2 && (
            <>
              <div className="absolute inset-0 opacity-50" style={{ background: `radial-gradient(ellipse at ${20 + variant4 * 8}% 20%, ${palette.wash} 0%, transparent 55%), radial-gradient(ellipse at ${85 - variant4 * 5}% 70%, ${palette.accent} 0%, transparent 45%)`, filter: "blur(0.5px)" }} />
              <div className="absolute inset-7 grid grid-cols-6 gap-2" style={{ opacity: 0.28 + variant4 * 0.04 }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <span key={i} className="w-1 h-1 rounded-none" style={{ backgroundColor: (i + variant4) % 3 === 0 ? palette.ink : palette.wash }} />
                ))}
              </div>
              <span className="absolute bottom-9 left-6 serif italic text-2xl tracking-tight" style={{ color: palette.ink }}>{initial}</span>
              <span className="absolute bottom-9 left-12 mono text-[8px] tracking-[0.15em] opacity-40" style={{ color: palette.ink }}>LIFE LOG · {variant4}</span>
              <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-none" style={{ backgroundColor: palette.accent }} />
              <span className="absolute bottom-6 left-6 right-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.18 }} />
              <span className="absolute bottom-[26px] right-6 mono text-[10px] tracking-[0.18em]" style={{ color: palette.ink }}>LIFE · {noNum} LOG</span>
              <PluginSymbol symbol={symbol as any} palette={palette} variant={variant} variant4={variant4} />
            </>
          )}
        </>
      )}

      {/* ---------- Typography：字骨标本 · 3布局×4点位×2度量=30 组合（v2：族徽+轻纹理+5-7元素）---------- */}
      {catName === "Typography" && (
        <>
          <LightTexture palette={palette} intensity="mid" />
          {variant3 === 0 && (
            <>
              {/* 1. 行基线网格 */}
              <div className="absolute inset-0 opacity-[0.18]" style={{ background: `repeating-linear-gradient(0deg, transparent ${20 - variant4}px, ${palette.wash} ${21 - variant4}px)` }} />
              {/* 2. 横基线 */}
              <span className="absolute left-6 right-6 top-[40%] h-px opacity-25" style={{ backgroundColor: palette.ink }} />
              <span className="absolute left-6 right-6 top-[40%] translate-y-[2px] h-px opacity-15" style={{ backgroundColor: palette.ink }} />
              {/* 3. 巨衬线 Aa */}
              <span className={`absolute top-[28%] ${shiftClass} serif italic leading-none select-none text-7xl font-light`} style={{ color: palette.ink }}>{initial}</span>
              {/* 4. 字号小标 */}
              <span className="absolute top-6 right-6 serif italic text-xs opacity-50" style={{ color: palette.ink }}>Aa · 56pt</span>
              {/* 5. pt 度量 */}
              <span className="absolute bottom-[34px] left-6 mono text-[10px] tracking-[0.2em] select-none" style={{ color: palette.ink }}>TYPE · {noNum} · x-height {40 + variant4 * 4}</span>
              {/* 6. 底部细发丝线 */}
              <span className="absolute bottom-6 left-6 right-6 h-px opacity-20" style={{ backgroundColor: palette.ink }} />
              {/* 7. 角点 */}
              <span className="absolute top-3 right-3 w-1.5 h-1.5" style={{ backgroundColor: palette.accent, opacity: 0.8 }} />
              <PluginSymbol symbol={symbol as any} palette={palette} variant={variant} variant4={variant4} />
            </>
          )}
          {variant3 === 1 && (
            <>
              {/* 1. 巨大引号 */}
              <span className="absolute top-3 left-6 serif text-[60px] leading-none select-none" style={{ color: palette.wash, opacity: 0.85 }}>"</span>
              {/* 2. 引号内主字 */}
              <span className="absolute top-12 left-16 serif italic text-5xl tracking-tight select-none" style={{ color: palette.ink, transform: `translateX(${variant4 * 2}px)` }}>{initial}</span>
              {/* 3. 引用样本 */}
              <span className="absolute bottom-8 left-16 mono text-[8px] tracking-[0.1em] opacity-40" style={{ color: palette.ink }}>"The quick brown fox · {variant4}px"</span>
              {/* 4. 度量竖线 */}
              <span className="absolute left-12 top-12 bottom-12 w-px opacity-20" style={{ backgroundColor: palette.ink }} />
              {/* 5. 度量数字 */}
              <span className="absolute left-4 top-12 mono text-[7px] opacity-40" style={{ color: palette.ink, writingMode: "vertical-rl" as any }}>56pt</span>
              {/* 6. 底分割线 */}
              <span className="absolute bottom-6 left-6 right-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.18 }} />
              {/* 7. 类别小标 */}
              <span className="absolute bottom-[26px] right-6 mono text-[10px] tracking-[0.18em]" style={{ color: palette.ink }}>TYP · {noNum} · {variant4}</span>
              <PluginSymbol symbol={symbol as any} palette={palette} variant={variant} variant4={variant4} />
            </>
          )}
          {variant3 === 2 && (
            <>
              {/* 1. 双栏栏标 */}
              <div className="absolute top-6 left-6 right-6 bottom-10 grid grid-cols-2 gap-3 opacity-40">
                <span className="border-l-2 pl-2.5 flex flex-col gap-1.5" style={{ borderColor: variant4 % 2 === 0 ? palette.wash : palette.ink }}>
                  <span className="h-1.5 w-full rounded-none" style={{ backgroundColor: palette.ink, opacity: 0.22 }} />
                  <span className="h-1 rounded-none" style={{ backgroundColor: palette.wash, width: `${68 + variant4 * 4}%` }} />
                  <span className="h-1 w-full rounded-none" style={{ backgroundColor: palette.wash }} />
                </span>
                <span className="border-l-2 pl-2.5 flex flex-col gap-1.5" style={{ borderColor: palette.wash }}>
                  <span className="h-1.5 w-full rounded-none" style={{ backgroundColor: palette.ink, opacity: 0.12 }} />
                  <span className="h-1 rounded-none" style={{ backgroundColor: palette.wash, width: `${60 + variant4 * 5}%` }} />
                </span>
              </div>
              {/* 2. 栏标签 */}
              <span className="absolute top-9 left-7 mono text-[6px] opacity-50" style={{ color: palette.ink }}>{12 + variant4} COL</span>
              <span className="absolute top-9 left-[50%] ml-1 mono text-[6px] opacity-50" style={{ color: palette.ink }}>{8 + variant4} COL</span>
              {/* 3. 大字 Aa */}
              <span className="absolute bottom-7 left-6 serif italic text-2xl" style={{ color: palette.ink }}>Aa</span>
              {/* 4. 字号对照 */}
              <span className="absolute bottom-7 right-20 mono text-[8px] tracking-[0.15em] opacity-50" style={{ color: palette.ink }}>16 · 24 · 40</span>
              {/* 5. 底分割线 */}
              <span className="absolute bottom-6 left-6 right-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.18 }} />
              {/* 6. 类别小标 */}
              <span className="absolute bottom-6 right-6 mono text-[10px] tracking-[0.18em]" style={{ color: palette.ink }}>TYP · {noNum} GRID</span>
              <PluginSymbol symbol={symbol as any} palette={palette} variant={variant} variant4={variant4} />
            </>
          )}
        </>
      )}

      {!isKnown && <FallbackCover initial={initial} palette={palette} variant={variant} />}
    </div>
  );
});
