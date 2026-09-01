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

function FallbackCover({ initial, palette, variant }: { initial: string; palette: any; variant: number }) {
  return (
    <>
      {variant === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-[3px] border-dashed flex items-center justify-center" style={{ borderColor: palette.ink }}>
              <span className="text-5xl font-serif italic" style={{ color: palette.ink }}>{initial}</span>
            </div>
            <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full" style={{ backgroundColor: palette.ink }} />
          </div>
        </div>
      )}
      {variant === 1 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-lg border-[3px]" style={{ borderColor: palette.ink }} />
            <div className="w-16 h-16 rounded-xl border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}>
              <span className="text-2xl font-serif font-bold" style={{ color: palette.ink }}>{initial}</span>
            </div>
            <div className="w-12 h-12 rounded-lg border-[3px]" style={{ borderColor: palette.ink }} />
          </div>
        </div>
      )}
      {variant === 2 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-24 h-32 rounded-xl border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}>
              <span className="text-4xl font-serif italic" style={{ color: palette.ink }}>{initial}</span>
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-2 rounded-full" style={{ backgroundColor: palette.ink }} />
          </div>
        </div>
      )}
      {variant === 3 && (
        <>
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 70% 30%, ${palette.wash} 0%, transparent 60%)` }} />
          <div className="absolute top-6 left-6">
            <div className="text-6xl font-serif italic leading-none" style={{ color: palette.ink }}>{initial}</div>
          </div>
          <div className="absolute bottom-6 right-6 flex flex-col gap-2 items-end">
            <div className="w-20 h-1.5 rounded" style={{ backgroundColor: palette.ink }} />
            <div className="w-14 h-1.5 rounded" style={{ backgroundColor: palette.ink }} />
            <div className="w-10 h-1.5 rounded" style={{ backgroundColor: palette.ink }} />
          </div>
        </>
      )}
      {variant === 4 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-2xl border-[3px] border-dashed flex items-center justify-center" style={{ borderColor: palette.ink }}>
              <span className="text-4xl font-serif italic" style={{ color: palette.ink }}>{initial}</span>
            </div>
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full" style={{ backgroundColor: palette.ink }} />
            <div className="absolute -bottom-3 -right-3 w-6 h-6 rounded-lg" style={{ backgroundColor: palette.ink }} />
          </div>
        </div>
      )}
      {variant === 5 && (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-5 items-end">
              {[50, 70, 40, 60, 55].map((h, i) => (
                <div key={i} className="w-5 rounded-t" style={{ height: `${h}%`, backgroundColor: palette.ink }} />
              ))}
            </div>
          </div>
          <span className="absolute bottom-4 left-6 text-xs font-mono tracking-widest" style={{ color: palette.ink }}>{initial}</span>
        </>
      )}
      {variant === 6 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink }}>
              <span className="text-3xl font-serif italic" style={{ color: palette.ink }}>{initial}</span>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2" style={{ borderColor: palette.ink }} />
          </div>
        </div>
      )}
      {variant === 7 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-lg border-[3px]" style={{ borderColor: palette.ink }} />
            <div className="w-5 h-px" style={{ backgroundColor: palette.ink }} />
            <div className="w-16 h-16 rounded-xl border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}>
              <span className="text-xl font-serif font-bold" style={{ color: palette.ink }}>{initial}</span>
            </div>
            <div className="w-5 h-px" style={{ backgroundColor: palette.ink }} />
            <div className="w-12 h-12 rounded-lg border-[3px]" style={{ borderColor: palette.ink }} />
          </div>
        </div>
      )}
    </>
  );
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

  return (
    <div
      aria-hidden="true"
      className={`group relative w-full overflow-hidden ${tall ? "aspect-[4/5]" : "aspect-[16/9]"}`}
      style={{ backgroundColor: palette.paper }}
    >
      <div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${palette.wash} 3px, ${palette.wash} 4px)` }} />

      {/* Design */}
      {catName === "Design" && variant === 0 && (<><span className={`absolute -top-6 font-serif italic leading-none select-none left-6 ${tall ? "text-[11rem]" : "text-[8rem]"}`} style={{ color: palette.ink }}>{initial}</span><span className="absolute bottom-4 right-6 block rounded-full h-16 w-16" style={{ backgroundColor: palette.wash, border: `2px solid ${palette.ink}` }} /><span className="absolute top-1/2 left-6 right-6 h-px" style={{ backgroundColor: palette.ink }} /></>)}
      {catName === "Design" && variant === 1 && (<><span className="absolute top-8 right-8 text-7xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</span><div className="absolute bottom-6 left-6 right-6 flex items-end gap-3"><div className="flex-1 h-px" style={{ backgroundColor: palette.ink }} /><span className="text-[10px] tracking-widest uppercase" style={{ color: palette.ink }}>Design</span><div className="flex-1 h-px" style={{ backgroundColor: palette.ink }} /></div><div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2"><div className="w-20 h-20 rounded-full border-2" style={{ borderColor: palette.ink }} /><div className="absolute top-2 left-2 w-16 h-16 rounded-full border" style={{ borderColor: palette.ink }} /></div></>)}
      {catName === "Design" && variant === 2 && (<><div className="absolute inset-0 flex items-center justify-center"><div className="grid grid-cols-3 gap-2">{Array.from({ length: 9 }).map((_, i) => (<div key={i} className="w-8 h-8 border-2" style={{ borderColor: palette.ink, transform: `rotate(${i * 10}deg)` }} />))}</div></div><span className="absolute bottom-6 left-6 text-4xl font-serif leading-none select-none" style={{ color: palette.ink }}>{initial}</span><span className="absolute top-6 right-6 w-12 h-12 rounded-full" style={{ backgroundColor: palette.wash }} /></>)}
      {catName === "Design" && variant === 3 && (<><div className="absolute top-6 left-6"><div className="w-16 h-1 rounded-full" style={{ backgroundColor: palette.ink }} /><div className="w-10 h-1 rounded-full mt-1" style={{ backgroundColor: palette.ink }} /><div className="w-6 h-1 rounded-full mt-1" style={{ backgroundColor: palette.ink }} /></div><span className="absolute bottom-4 right-6 font-serif italic text-6xl leading-none select-none" style={{ color: palette.ink }}>{initial}</span><span className="absolute top-1/2 right-1/4 w-24 h-px" style={{ backgroundColor: palette.ink }} /></>)}
      {catName === "Design" && variant === 4 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="w-24 h-24 border-[3px] border-dashed rounded-full flex items-center justify-center" style={{ borderColor: palette.ink }}><span className="text-2xl font-serif" style={{ color: palette.ink }}>{initial}</span></div><div className="absolute -top-2 -right-2 w-6 h-6 rounded-full" style={{ backgroundColor: palette.ink }} /></div></div>)}
      {catName === "Design" && variant === 5 && (<><div className="absolute top-0 left-0 w-full h-1/2 overflow-hidden"><div className="absolute inset-0 flex items-center justify-center"><span className="text-[10rem] font-serif italic leading-none select-none -translate-y-1/4" style={{ color: palette.ink }}>{initial}</span></div></div><div className="absolute bottom-6 left-6 flex items-center gap-3"><div className="w-8 h-8 rounded-full border-2" style={{ borderColor: palette.ink }} /><div><div className="w-20 h-1 rounded" style={{ backgroundColor: palette.ink }} /><div className="w-12 h-1 rounded mt-1" style={{ backgroundColor: palette.ink }} /></div></div></>)}
      {catName === "Design" && variant === 6 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="w-20 h-20 rounded-xl border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}><span className="text-3xl font-serif font-bold" style={{ color: palette.ink }}>{initial}</span></div><div className="absolute -top-3 -right-3 w-8 h-8 rounded-full" style={{ backgroundColor: palette.ink }} /></div></div>)}
      {catName === "Design" && variant === 7 && (<div className="absolute inset-0 flex items-center justify-center"><div className="flex gap-4 items-center"><div className="w-12 h-12 rounded-lg border-[3px]" style={{ borderColor: palette.ink }} /><div className="w-16 h-16 rounded-xl border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}><span className="text-2xl font-serif font-bold" style={{ color: palette.ink }}>{initial}</span></div><div className="w-12 h-12 rounded-lg border-[3px]" style={{ borderColor: palette.ink }} /></div></div>)}

      {/* Plugin */}
      {catName === "Plugin" && variant === 0 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="w-20 h-20 rounded-xl border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}><span className="text-3xl font-bold font-serif" style={{ color: palette.ink }}>P</span><div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-3 rounded-t-lg" style={{ backgroundColor: palette.ink }} /><div className="absolute top-1/2 -right-3 -translate-y-1/2 w-3 h-4 rounded-r-lg" style={{ backgroundColor: palette.ink }} /></div><div className="absolute -top-4 -right-4 w-8 h-8 rounded-lg border-2" style={{ borderColor: palette.ink, backgroundColor: palette.paper }} /><div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-md" style={{ backgroundColor: palette.ink }} /><div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: palette.ink }}><span className="text-white text-[10px] font-bold">+</span></div></div></div>)}
      {catName === "Plugin" && variant === 1 && (<div className="absolute inset-0 flex items-center justify-center"><div className="flex gap-3 items-center"><div className="w-12 h-12 rounded-lg border-[3px] rotate-6" style={{ borderColor: palette.ink, backgroundColor: palette.wash }} /><div className="w-16 h-16 rounded-xl border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink }}><span className="text-2xl font-bold" style={{ color: palette.ink }}>+</span></div><div className="w-12 h-12 rounded-lg border-[3px] -rotate-6" style={{ borderColor: palette.ink, backgroundColor: palette.wash }} /></div></div>)}
      {catName === "Plugin" && variant === 2 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="w-24 h-16 rounded-lg border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}><div className="flex gap-1">{[0, 1, 2].map((i) => (<div key={i} className="w-2 h-6 rounded-sm" style={{ backgroundColor: palette.ink }} />))}</div></div><div className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-2" style={{ borderColor: palette.ink, backgroundColor: palette.paper }} /><div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full border-2" style={{ borderColor: palette.ink, backgroundColor: palette.paper }} /></div></div>)}
      {catName === "Plugin" && variant === 3 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="w-20 h-20 rounded-2xl rotate-12 flex items-center justify-center" style={{ backgroundColor: palette.ink }}><div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: palette.wash }}><span className="text-xl font-bold" style={{ color: palette.ink }}>⚡</span></div></div><div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-2 rounded-full" style={{ backgroundColor: palette.ink }} /></div></div>)}
      {catName === "Plugin" && variant === 4 && (<div className="absolute inset-0 flex items-center justify-center"><div className="grid grid-cols-2 gap-4">{["{ }", "< >", "( )", "[ ]"].map((sym, i) => (<div key={i} className="w-14 h-14 rounded-lg border-2 flex items-center justify-center font-mono text-sm" style={{ borderColor: palette.ink, color: palette.ink }}>{sym}</div>))}</div></div>)}
      {catName === "Plugin" && variant === 5 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="flex gap-2 items-center"><div className="w-10 h-10 rounded-lg border-[3px]" style={{ borderColor: palette.ink }} /><div className="w-4 h-px" style={{ backgroundColor: palette.ink }} /><div className="w-14 h-14 rounded-xl border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}><span className="text-lg font-bold" style={{ color: palette.ink }}>✓</span></div><div className="w-4 h-px" style={{ backgroundColor: palette.ink }} /><div className="w-10 h-10 rounded-lg border-[3px]" style={{ borderColor: palette.ink }} /></div></div></div>)}
      {catName === "Plugin" && variant === 6 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="w-24 h-24 rounded-2xl border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}><span className="text-4xl font-serif font-bold" style={{ color: palette.ink }}>{initial}</span></div><div className="absolute -top-3 -right-3 w-8 h-8 rounded-full" style={{ backgroundColor: palette.ink }} /><div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-lg" style={{ backgroundColor: palette.ink }} /></div></div>)}
      {catName === "Plugin" && variant === 7 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="w-20 h-20 rounded-xl border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}><span className="text-3xl font-bold" style={{ color: palette.ink }}>+</span></div><div className="absolute -top-4 -right-4 w-10 h-10 rounded-lg border-2" style={{ borderColor: palette.ink, backgroundColor: palette.paper }} /><div className="absolute -bottom-3 -left-3 w-8 h-8 rounded-full" style={{ backgroundColor: palette.ink }} /></div></div>)}

      {/* Engineering */}
      {catName === "Engineering" && variant === 0 && (<><div className="absolute inset-4" style={{ backgroundImage: `linear-gradient(${palette.wash} 1px, transparent 1px), linear-gradient(90deg, ${palette.wash} 1px, transparent 1px)`, backgroundSize: "24px 24px" }} /><span className="absolute top-1/3 left-6 h-3 w-3 rounded-full" style={{ backgroundColor: palette.ink }} /><span className="absolute top-1/3 left-6 right-10 h-px" style={{ backgroundColor: palette.ink }} /><span className="absolute top-1/3 right-8 h-2 w-2 rounded-full" style={{ backgroundColor: palette.ink }} /><span className="absolute bottom-6 right-8 h-10 w-10 rounded-full border-2" style={{ borderColor: palette.ink }} /></>)}
      {catName === "Engineering" && variant === 1 && (<div className="absolute inset-0 flex items-center justify-center"><svg width="120" height="80" viewBox="0 0 120 80" fill="none"><rect x="10" y="10" width="100" height="60" rx="4" stroke={palette.ink} strokeWidth="2" /><line x1="10" y1="30" x2="110" y2="30" stroke={palette.ink} strokeWidth="1.5" /><circle cx="30" cy="50" r="8" stroke={palette.ink} strokeWidth="2" fill="none" /><circle cx="70" cy="50" r="5" fill={palette.ink} /><line x1="40" y1="50" x2="62" y2="50" stroke={palette.ink} strokeWidth="1.5" /><rect x="80" y="42" width="16" height="16" rx="2" stroke={palette.ink} strokeWidth="2" fill="none" /></svg></div>)}
      {catName === "Engineering" && variant === 2 && (<><div className="absolute top-6 left-6 right-6 flex gap-2">{[1, 2, 3].map((i) => (<div key={i} className="h-2 rounded-full flex-1" style={{ backgroundColor: palette.ink }} />))}</div><div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">{[40, 65, 35, 80, 50].map((h, i) => (<div key={i} className="w-4 rounded-t" style={{ height: `${h}%`, backgroundColor: palette.ink }} />))}</div></>)}
      {catName === "Engineering" && variant === 3 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="w-32 h-20 border-[3px] rounded-lg" style={{ borderColor: palette.ink }}><div className="absolute top-2 left-2 right-2 h-1 rounded" style={{ backgroundColor: palette.ink }} /><div className="absolute top-5 left-2 right-8 h-1 rounded" style={{ backgroundColor: palette.ink }} /><div className="absolute bottom-2 left-2 w-12 h-1 rounded" style={{ backgroundColor: palette.ink }} /></div><div className="absolute -top-3 -right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: palette.ink, backgroundColor: palette.paper }}><div className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.ink }} /></div></div></div>)}
      {catName === "Engineering" && variant === 4 && (<div className="absolute inset-0 flex items-center justify-center"><div className="flex flex-col items-center gap-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded border-[3px]" style={{ borderColor: palette.ink }} /><div className="w-6 h-px" style={{ backgroundColor: palette.ink }} /><div className="w-8 h-8 rounded-full border-[3px]" style={{ borderColor: palette.ink }} /></div><div className="w-px h-6" style={{ backgroundColor: palette.ink }} /><div className="w-24 h-1 rounded" style={{ backgroundColor: palette.ink }} /></div></div>)}
      {catName === "Engineering" && variant === 5 && (<div className="absolute inset-0 flex items-center justify-center"><div className="grid grid-cols-4 gap-2">{Array.from({ length: 16 }).map((_, i) => (<div key={i} className="w-6 h-6 rounded-sm" style={{ backgroundColor: i % 3 === 0 ? palette.ink : palette.wash }} />))}</div></div>)}
      {catName === "Engineering" && variant === 6 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="w-24 h-24 rounded-xl border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}><span className="text-3xl font-mono font-bold" style={{ color: palette.ink }}>{"</>"}</span></div><div className="absolute -top-3 -right-3 w-8 h-8 rounded-full" style={{ backgroundColor: palette.ink }} /></div></div>)}
      {catName === "Engineering" && variant === 7 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="w-20 h-20 rounded-2xl border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}><span className="text-2xl font-mono font-bold" style={{ color: palette.ink }}>{initial}</span></div><div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-2 rounded-full" style={{ backgroundColor: palette.ink }} /></div></div>)}

      {/* Typography */}
      {catName === "Typography" && variant === 0 && (<><div className="absolute inset-6 flex flex-col justify-center gap-4">{[0, 1, 2, 3].map((i) => (<div key={i} className="flex items-center gap-3"><span className="text-[10px] font-mono tracking-widest w-8" style={{ color: palette.ink }}>{["H1", "H2", "P", "SM"][i]}</span><span className="h-px flex-1" style={{ backgroundColor: palette.ink, height: `${[3, 2, 1.5, 1][i]}px` }} /><span className="text-[9px] tracking-wide font-mono" style={{ color: palette.ink }}>{[24, 18, 15, 12][i]}px</span></div>))}</div><span className="absolute bottom-3 right-5 text-6xl font-serif leading-none select-none" style={{ color: palette.ink }}>T</span></>)}
      {catName === "Typography" && variant === 1 && (<><div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><span className="block text-5xl font-serif italic leading-none" style={{ color: palette.ink }}>Aa</span><div className="mt-4 flex gap-1 justify-center">{[0.3, 0.5, 0.7, 0.9].map((o, i) => (<div key={i} className="w-8 h-1 rounded" style={{ backgroundColor: palette.ink }} />))}</div></div></div><span className="absolute bottom-4 left-6 text-[10px] font-mono tracking-widest" style={{ color: palette.ink }}>TYPOGRAPHY</span></>)}
      {catName === "Typography" && variant === 2 && (<><div className="absolute inset-0 flex items-center justify-center"><div className="flex items-end gap-4">{["A", "B", "C", "D", "E"].map((letter, i) => (<span key={i} className="font-serif leading-none select-none" style={{ color: palette.ink, fontSize: `${20 + i * 8}px` }}>{letter}</span>))}</div></div><div className="absolute bottom-6 left-6 right-6 h-px" style={{ backgroundColor: palette.ink }} /></>)}
      {catName === "Typography" && variant === 3 && (<><div className="absolute top-6 left-6"><span className="text-4xl font-serif italic leading-none" style={{ color: palette.ink }}>Ag</span></div><div className="absolute bottom-6 right-6 text-right"><div className="text-[9px] font-mono tracking-widest" style={{ color: palette.ink }}>12 / 16 / 24</div><div className="flex gap-1 mt-1 justify-end">{[1, 2, 3, 4, 5].map((i) => (<div key={i} className="w-1" style={{ height: `${i * 4}px`, backgroundColor: palette.ink }} />))}</div></div></>)}
      {catName === "Typography" && variant === 4 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="text-8xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</div><div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: palette.ink }} /><div className="absolute -bottom-3 left-0 text-[8px] font-mono" style={{ color: palette.ink }}>baseline</div></div></div>)}
      {catName === "Typography" && variant === 5 && (<div className="absolute inset-0 flex items-center justify-center"><div className="grid grid-cols-5 gap-1">{["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"].map((letter, i) => (<div key={i} className="w-6 h-6 flex items-center justify-center text-[10px] font-mono" style={{ color: palette.ink }}>{letter}</div>))}</div></div>)}
      {catName === "Typography" && variant === 6 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="text-6xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</div><div className="absolute -bottom-4 left-0 right-0 h-px" style={{ backgroundColor: palette.ink }} /></div></div>)}
      {catName === "Typography" && variant === 7 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="w-24 h-24 rounded-full border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink }}><span className="text-3xl font-serif italic" style={{ color: palette.ink }}>{initial}</span></div></div></div>)}

      {/* Frontend */}
      {catName === "Frontend" && variant === 0 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="absolute -top-5 -left-5 w-28 h-18 rounded-lg border-2 bg-white/70" style={{ borderColor: palette.ink, transform: "rotate(-4deg)" }} /><div className="relative w-28 h-18 rounded-lg border-[3px] flex items-center justify-center" style={{ backgroundColor: palette.wash, borderColor: palette.ink }}><span className="text-3xl font-mono font-bold" style={{ color: palette.ink }}>{"</>"}</span></div><div className="absolute -bottom-2 -right-2 w-24 h-3 rounded-full" style={{ backgroundColor: palette.ink }} /></div></div>)}
      {catName === "Frontend" && variant === 1 && (<div className="absolute inset-0 flex items-center justify-center"><div className="flex flex-col gap-2 items-start"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: palette.ink }} /><span className="w-20 h-1.5 rounded" style={{ backgroundColor: palette.ink }} /></div><div className="flex items-center gap-2 ml-4"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: palette.ink }} /><span className="w-16 h-1.5 rounded" style={{ backgroundColor: palette.ink }} /></div><div className="flex items-center gap-2 ml-8"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: palette.ink }} /><span className="w-12 h-1.5 rounded" style={{ backgroundColor: palette.ink }} /></div></div></div>)}
      {catName === "Frontend" && variant === 2 && (<div className="absolute inset-0 flex items-center justify-center"><div className="grid grid-cols-2 gap-3"><div className="w-16 h-12 rounded border-[3px]" style={{ borderColor: palette.ink, backgroundColor: palette.wash }} /><div className="w-16 h-12 rounded border-[3px]" style={{ borderColor: palette.ink }} /><div className="w-16 h-12 rounded border-[3px]" style={{ borderColor: palette.ink }} /><div className="w-16 h-12 rounded border-[3px]" style={{ borderColor: palette.ink, backgroundColor: palette.wash }} /></div></div>)}
      {catName === "Frontend" && variant === 3 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="w-32 h-20 rounded-lg border-[3px] overflow-hidden" style={{ borderColor: palette.ink }}><div className="h-4 border-b flex items-center px-2 gap-1" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}><div className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.ink }} /><div className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.ink }} /><div className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.ink }} /></div><div className="p-2 space-y-1"><div className="h-1 rounded" style={{ backgroundColor: palette.ink }} /><div className="h-1 rounded w-3/4" style={{ backgroundColor: palette.ink }} /><div className="h-1 rounded w-1/2" style={{ backgroundColor: palette.ink }} /></div></div></div></div>)}
      {catName === "Frontend" && variant === 4 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="w-28 h-28 rounded-2xl border-[3px] border-dashed flex items-center justify-center" style={{ borderColor: palette.ink }}><div className="text-center"><div className="text-2xl font-mono" style={{ color: palette.ink }}>{'<>'}</div><div className="mt-2 flex gap-1 justify-center">{[0.3, 0.5, 0.7].map((o, i) => (<div key={i} className="w-6 h-1 rounded" style={{ backgroundColor: palette.ink }} />))}</div></div></div></div></div>)}
      {catName === "Frontend" && variant === 5 && (<div className="absolute inset-0 flex items-center justify-center"><div className="grid grid-cols-3 gap-2">{["div", "span", "p", "h1", "a", "img"].map((tag, i) => (<div key={i} className="px-2 py-1 rounded border-2 text-center font-mono text-[10px]" style={{ borderColor: palette.ink, color: palette.ink }}>{tag}</div>))}</div></div>)}
      {catName === "Frontend" && variant === 6 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="w-24 h-24 rounded-xl border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}><span className="text-3xl font-mono font-bold" style={{ color: palette.ink }}>{initial}</span></div><div className="absolute -top-3 -right-3 w-8 h-8 rounded-full" style={{ backgroundColor: palette.ink }} /></div></div>)}
      {catName === "Frontend" && variant === 7 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="w-20 h-20 rounded-2xl border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}><span className="text-2xl font-mono font-bold" style={{ color: palette.ink }}>{initial}</span></div><div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-2 rounded-full" style={{ backgroundColor: palette.ink }} /></div></div>)}

      {/* Snippet */}
      {catName === "Snippet" && variant === 0 && (<><span className="absolute top-6 h-24 w-24 rounded-full left-6" style={{ backgroundColor: palette.wash }} /><span className="absolute top-12 h-16 w-16 rounded-full left-1/2" style={{ backgroundColor: palette.ink }} /><span className="absolute bottom-12 right-12 h-3 w-3 rounded-full" style={{ backgroundColor: palette.ink }} /><span className="absolute bottom-8 left-6 right-6 h-px" style={{ backgroundColor: palette.ink }} /><span className="absolute bottom-4 left-6 font-serif italic text-sm" style={{ color: palette.ink }}>No. {post.id.slice(0, 4)}</span></>)}
      {catName === "Snippet" && variant === 1 && (<><div className="absolute inset-0 flex items-center justify-center"><div className="flex gap-4 items-center"><div className="w-16 h-16 rounded-full" style={{ backgroundColor: palette.wash }} /><div className="w-10 h-10 rounded-full" style={{ backgroundColor: palette.ink }} /><div className="w-6 h-6 rounded-full" style={{ backgroundColor: palette.ink }} /></div></div><span className="absolute bottom-4 left-6 text-[10px] font-mono tracking-widest" style={{ color: palette.ink }}>SNIPPET</span></>)}
      {catName === "Snippet" && variant === 2 && (<><div className="absolute top-8 left-8 right-8 bottom-8 border-[3px] rounded-lg" style={{ borderColor: palette.ink }} /><div className="absolute top-12 left-12 right-12 bottom-12 border-2 rounded" style={{ borderColor: palette.ink }} /><span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-serif italic" style={{ color: palette.ink }}>{initial}</span><span className="absolute bottom-6 left-6 text-[9px] font-mono tracking-widest" style={{ color: palette.ink }}>NOTE</span></>)}
      {catName === "Snippet" && variant === 3 && (<><div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><span className="block text-4xl font-serif italic leading-none mb-2" style={{ color: palette.ink }}>{initial}</span><div className="w-8 h-0.5 mx-auto" style={{ backgroundColor: palette.ink }} /></div></div><span className="absolute bottom-4 left-6 text-[10px] tracking-widest" style={{ color: palette.ink }}>· · ·</span><span className="absolute top-6 right-6 text-[9px] font-mono" style={{ color: palette.ink }}>{post.id.slice(0, 6)}</span></>)}
      {catName === "Snippet" && variant === 4 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="w-20 h-20 rounded-full border-[3px] border-dashed flex items-center justify-center" style={{ borderColor: palette.ink }}><span className="text-3xl font-serif italic" style={{ color: palette.ink }}>{initial}</span></div><div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-px" style={{ backgroundColor: palette.ink }} /></div></div>)}
      {catName === "Snippet" && variant === 5 && (<><div className="absolute inset-0 flex items-center justify-center"><div className="flex gap-3 items-center"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.ink }} /><div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.ink }} /><div className="w-6 h-6 rounded-full" style={{ backgroundColor: palette.ink }} /><div className="w-8 h-8 rounded-full" style={{ backgroundColor: palette.ink }} /><div className="w-10 h-10 rounded-full" style={{ backgroundColor: palette.ink }} /></div></div><span className="absolute bottom-4 left-6 font-serif italic text-sm" style={{ color: palette.ink }}>· · ·</span></>)}
      {catName === "Snippet" && variant === 6 && (<><div className="absolute top-0 right-0 w-1/2 h-full"><div className="absolute inset-0 flex items-center justify-center"><div className="w-32 h-32 rounded-full border-[3px] border-dashed" style={{ borderColor: palette.ink }} /></div></div><div className="absolute bottom-6 left-6"><div className="text-4xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</div><div className="w-8 h-0.5 mt-2" style={{ backgroundColor: palette.ink }} /></div></>)}
      {catName === "Snippet" && variant === 7 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="w-24 h-24 rounded-2xl rotate-6 flex items-center justify-center" style={{ border: `3px solid ${palette.ink}`, backgroundColor: palette.wash }}><span className="text-3xl font-serif italic" style={{ color: palette.ink }}>{initial}</span></div><div className="absolute -top-2 -right-2 w-8 h-8 rounded-full" style={{ backgroundColor: palette.ink }} /><div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-lg" style={{ backgroundColor: palette.ink }} /></div></div>)}

      {/* Life */}
      {catName === "Life" && variant === 0 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="w-20 h-28 rounded-t-[40px] border-[3px]" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}><div className="absolute top-3 left-3 right-3 h-1 rounded" style={{ backgroundColor: palette.ink }} /><div className="absolute top-6 left-3 right-5 h-1 rounded" style={{ backgroundColor: palette.ink }} /><div className="absolute top-9 left-3 right-4 h-1 rounded" style={{ backgroundColor: palette.ink }} /></div><div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full" style={{ backgroundColor: palette.ink }} /></div></div>)}
      {catName === "Life" && variant === 1 && (<><div className="absolute top-0 left-0 w-full h-1/3 overflow-hidden"><div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${palette.wash} 0%, transparent 60%)` }} /></div><div className="absolute bottom-6 left-6 right-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink }}><span className="text-lg font-serif" style={{ color: palette.ink }}>{initial}</span></div><div className="flex-1"><div className="w-24 h-1.5 rounded" style={{ backgroundColor: palette.ink }} /><div className="w-16 h-1 rounded mt-1.5" style={{ backgroundColor: palette.ink }} /></div></div></div><span className="absolute top-6 right-6 w-8 h-8 rounded-full" style={{ backgroundColor: palette.ink }} /></>)}
      {catName === "Life" && variant === 2 && (<div className="absolute inset-0 flex items-center justify-center"><div className="grid grid-cols-2 gap-4"><div className="w-20 h-20 rounded-2xl border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}><span className="text-2xl">🏠</span></div><div className="w-20 h-20 rounded-2xl border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink }}><span className="text-2xl">☕</span></div></div></div>)}
      {catName === "Life" && variant === 3 && (<><div className="absolute inset-0"><div className="absolute top-0 left-0 w-full h-full" style={{ background: `radial-gradient(circle at 30% 70%, ${palette.wash} 0%, transparent 50%)` }} /></div><div className="absolute bottom-6 left-6"><div className="text-5xl font-serif italic leading-none select-none" style={{ color: palette.ink }}>{initial}</div></div><div className="absolute top-6 right-6 flex flex-col gap-1 items-end"><div className="w-16 h-1 rounded" style={{ backgroundColor: palette.ink }} /><div className="w-10 h-1 rounded" style={{ backgroundColor: palette.ink }} /><div className="w-6 h-1 rounded" style={{ backgroundColor: palette.ink }} /></div></>)}
      {catName === "Life" && variant === 4 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="w-28 h-28 rounded-full border-[3px] border-dashed flex items-center justify-center" style={{ borderColor: palette.ink }}><div className="w-20 h-20 rounded-full border-2 flex items-center justify-center" style={{ borderColor: palette.ink }}><span className="text-xl" style={{ color: palette.ink }}>☀️</span></div></div><div className="absolute -top-2 -right-2 w-5 h-5 rounded-full" style={{ backgroundColor: palette.ink }} /></div></div>)}
      {catName === "Life" && variant === 5 && (<><div className="absolute inset-0 flex items-center justify-center"><div className="flex gap-4 items-end">{[40, 60, 30, 50, 45].map((h, i) => (<div key={i} className="w-3 rounded-t" style={{ height: `${h}%`, backgroundColor: palette.ink }} />))}</div></div><span className="absolute bottom-4 left-6 text-[10px] font-mono tracking-widest" style={{ color: palette.ink }}>LIFE</span></>)}
      {catName === "Life" && variant === 6 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="w-24 h-24 rounded-xl border-[3px] rotate-12 flex items-center justify-center" style={{ backgroundColor: palette.ink }}><div className="w-20 h-20 rounded-lg flex items-center justify-center" style={{ backgroundColor: palette.wash }}><span className="text-2xl">🌱</span></div></div><div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-2 rounded-full" style={{ backgroundColor: palette.ink }} /></div></div>)}
      {catName === "Life" && variant === 7 && (<div className="absolute inset-0 flex items-center justify-center"><div className="relative"><div className="flex gap-3 items-center"><div className="w-8 h-8 rounded-lg border-[3px]" style={{ borderColor: palette.ink }} /><div className="w-4 h-px" style={{ backgroundColor: palette.ink }} /><div className="w-12 h-12 rounded-xl border-[3px] flex items-center justify-center" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}><span className="text-lg">☕</span></div><div className="w-4 h-px" style={{ backgroundColor: palette.ink }} /><div className="w-8 h-8 rounded-lg border-[3px]" style={{ borderColor: palette.ink }} /></div></div></div>)}

      {/* Fallback */}
      {!isKnown && <FallbackCover initial={initial} palette={palette} variant={variant} />}
    </div>
  );
});
