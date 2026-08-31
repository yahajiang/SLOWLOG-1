import { memo } from "react";
import { ART_PALETTES } from "@/lib/categories";
import type { Post } from "@/lib/types";

export const ArticleArt = memo(function ArticleArt({
  post,
  tall = false,
}: {
  post: Post;
  tall?: boolean;
}) {
  const palette = ART_PALETTES[post.category] || { paper: "#F9FAFB", ink: "#52525B", wash: "#E4E4E7" };
  const variant = post.id.length % 6; // 6 variants
  const initial = post.title.charAt(0);
  const shift =
    variant === 0 ? "left-6" : variant === 1 ? "left-1/4" : variant === 2 ? "left-1/2" : variant === 3 ? "right-6" : variant === 4 ? "right-1/4" : "right-1/2";
  const tilt =
    variant === 0 ? "rotate-6" : variant === 1 ? "-rotate-3" : variant === 2 ? "rotate-12" : variant === 3 ? "-rotate-6" : variant === 4 ? "rotate-3" : "-rotate-12";

  return (
    <div
      aria-hidden="true"
      className={`group relative w-full overflow-hidden border-b border-zinc-200 ${tall ? "aspect-[4/5]" : "aspect-[16/9]"}`}
      style={{ backgroundColor: palette.paper }}
    >
      {/* Paper grain texture */}
      <div
        className="absolute inset-0 opacity-30 transition-opacity duration-500 group-hover:opacity-50"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${palette.wash} 3px, ${palette.wash} 4px)`,
        }}
      />

      {/* ================================================================
          Design (设计) - 6 variants
          ================================================================ */}
      {post.category === "Design" && variant === 0 && (
        <>
          <span className={`absolute -top-6 font-serif italic leading-none select-none left-6 ${tall ? "text-[11rem]" : "text-[8rem]"}`} style={{ color: palette.ink, opacity: 0.85 }}>
            {initial}
          </span>
          <span className="absolute bottom-4 right-6 block rounded-full mix-blend-multiply h-16 w-16 transition-transform duration-500 group-hover:scale-110" style={{ backgroundColor: palette.wash, border: `1px solid ${palette.ink}` }} />
          <span className="absolute top-1/2 left-6 right-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.15 }} />
        </>
      )}
      {post.category === "Design" && variant === 1 && (
        <>
          <span className="absolute top-8 right-8 text-7xl font-serif italic leading-none select-none" style={{ color: palette.ink, opacity: 0.1 }}>{initial}</span>
          <div className="absolute bottom-6 left-6 right-6 flex items-end gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: palette.ink, opacity: 0.3 }} />
            <span className="text-[10px] tracking-widest uppercase" style={{ color: palette.ink, opacity: 0.5 }}>Design</span>
            <div className="flex-1 h-px" style={{ backgroundColor: palette.ink, opacity: 0.3 }} />
          </div>
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-20 h-20 rounded-full border-2 transition-transform duration-700 group-hover:rotate-45" style={{ borderColor: palette.ink }} />
            <div className="absolute top-2 left-2 w-16 h-16 rounded-full border" style={{ borderColor: palette.ink, opacity: 0.3 }} />
          </div>
        </>
      )}
      {post.category === "Design" && variant === 2 && (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid grid-cols-3 gap-2 opacity-20 transition-opacity duration-500 group-hover:opacity-40">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="w-8 h-8 border transition-transform duration-500" style={{ borderColor: palette.ink, transform: `rotate(${i * 10}deg)` }} />
              ))}
            </div>
          </div>
          <span className="absolute bottom-6 left-6 text-4xl font-serif leading-none select-none" style={{ color: palette.ink, opacity: 0.15 }}>{initial}</span>
          <span className="absolute top-6 right-6 w-12 h-12 rounded-full transition-transform duration-500 group-hover:scale-125" style={{ backgroundColor: palette.wash }} />
        </>
      )}
      {post.category === "Design" && variant === 3 && (
        <>
          <div className="absolute top-6 left-6">
            <div className="w-16 h-1 rounded-full" style={{ backgroundColor: palette.ink }} />
            <div className="w-10 h-1 rounded-full mt-1" style={{ backgroundColor: palette.ink, opacity: 0.4 }} />
            <div className="w-6 h-1 rounded-full mt-1" style={{ backgroundColor: palette.ink, opacity: 0.2 }} />
          </div>
          <span className="absolute bottom-4 right-6 font-serif italic text-6xl leading-none select-none" style={{ color: palette.ink, opacity: 0.08 }}>{initial}</span>
          <span className="absolute top-1/2 right-1/4 w-24 h-px" style={{ backgroundColor: palette.ink, opacity: 0.1 }} />
        </>
      )}
      {post.category === "Design" && variant === 4 && (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-24 h-24 border-2 border-dashed rounded-full flex items-center justify-center transition-transform duration-700 group-hover:rotate-90" style={{ borderColor: palette.ink }}>
                <span className="text-2xl font-serif" style={{ color: palette.ink, opacity: 0.6 }}>{initial}</span>
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full" style={{ backgroundColor: palette.ink, opacity: 0.2 }} />
            </div>
          </div>
        </>
      )}
      {post.category === "Design" && variant === 5 && (
        <>
          <div className="absolute top-0 left-0 w-full h-1/2 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10rem] font-serif italic leading-none select-none -translate-y-1/4" style={{ color: palette.ink, opacity: 0.06 }}>{initial}</span>
            </div>
          </div>
          <div className="absolute bottom-6 left-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border" style={{ borderColor: palette.ink }} />
            <div>
              <div className="w-20 h-1 rounded" style={{ backgroundColor: palette.ink, opacity: 0.3 }} />
              <div className="w-12 h-1 rounded mt-1" style={{ backgroundColor: palette.ink, opacity: 0.15 }} />
            </div>
          </div>
        </>
      )}

      {/* ================================================================
          Plugin (插件) - 6 variants
          ================================================================ */}
      {post.category === "Plugin" && variant === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-xl border-2 flex items-center justify-center transition-transform duration-500 group-hover:scale-105" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}>
              <span className="text-3xl font-bold font-serif" style={{ color: palette.ink }}>P</span>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-3 rounded-t-lg" style={{ backgroundColor: palette.ink, opacity: 0.3 }} />
              <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-3 h-4 rounded-r-lg" style={{ backgroundColor: palette.ink, opacity: 0.3 }} />
            </div>
            <div className="absolute -top-4 -right-4 w-8 h-8 rounded-lg border transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" style={{ borderColor: palette.ink, backgroundColor: palette.paper, opacity: 0.7 }} />
            <div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-md" style={{ backgroundColor: palette.ink, opacity: 0.2 }} />
            <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: palette.ink }}>
              <span className="text-white text-[10px] font-bold">+</span>
            </div>
          </div>
        </div>
      )}
      {post.category === "Plugin" && variant === 1 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-lg border-2 rotate-6 transition-transform duration-500 group-hover:rotate-12" style={{ borderColor: palette.ink, backgroundColor: palette.wash }} />
            <div className="w-16 h-16 rounded-xl border-2 flex items-center justify-center transition-transform duration-500 group-hover:scale-110" style={{ borderColor: palette.ink }}>
              <span className="text-2xl font-bold" style={{ color: palette.ink }}>+</span>
            </div>
            <div className="w-12 h-12 rounded-lg border-2 -rotate-6 transition-transform duration-500 group-hover:-rotate-12" style={{ borderColor: palette.ink, backgroundColor: palette.wash }} />
          </div>
        </div>
      )}
      {post.category === "Plugin" && variant === 2 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-24 h-16 rounded-lg border-2 flex items-center justify-center" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-6 rounded-sm transition-all duration-500" style={{ backgroundColor: palette.ink, opacity: 0.3 + i * 0.2 }} />
                ))}
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-2" style={{ borderColor: palette.ink, backgroundColor: palette.paper }} />
            <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full border-2" style={{ borderColor: palette.ink, backgroundColor: palette.paper }} />
          </div>
        </div>
      )}
      {post.category === "Plugin" && variant === 3 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl rotate-12 flex items-center justify-center transition-transform duration-700 group-hover:rotate-0" style={{ backgroundColor: palette.ink }}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: palette.wash }}>
                <span className="text-xl font-bold" style={{ color: palette.ink }}>⚡</span>
              </div>
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-2 rounded-full blur-sm" style={{ backgroundColor: palette.ink, opacity: 0.15 }} />
          </div>
        </div>
      )}
      {post.category === "Plugin" && variant === 4 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-4">
            {["{ }", "< >", "( )", "[ ]"].map((sym, i) => (
              <div key={i} className="w-14 h-14 rounded-lg border flex items-center justify-center font-mono text-sm transition-transform duration-500 hover:scale-110" style={{ borderColor: palette.ink, color: palette.ink, opacity: 0.4 + i * 0.15 }}>
                {sym}
              </div>
            ))}
          </div>
        </div>
      )}
      {post.category === "Plugin" && variant === 5 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="flex gap-2 items-center">
              <div className="w-10 h-10 rounded-lg border-2" style={{ borderColor: palette.ink }} />
              <div className="w-4 h-px" style={{ backgroundColor: palette.ink, opacity: 0.4 }} />
              <div className="w-14 h-14 rounded-xl border-2 flex items-center justify-center" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}>
                <span className="text-lg font-bold" style={{ color: palette.ink }}>✓</span>
              </div>
              <div className="w-4 h-px" style={{ backgroundColor: palette.ink, opacity: 0.4 }} />
              <div className="w-10 h-10 rounded-lg border-2" style={{ borderColor: palette.ink }} />
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          Engineering (工程) - 6 variants
          ================================================================ */}
      {post.category === "Engineering" && variant === 0 && (
        <>
          <div className="absolute inset-4" style={{ backgroundImage: `linear-gradient(${palette.wash} 1px, transparent 1px), linear-gradient(90deg, ${palette.wash} 1px, transparent 1px)`, backgroundSize: "24px 24px" }} />
          <span className="absolute top-1/3 left-6 h-3 w-3 rounded-full" style={{ backgroundColor: palette.ink }} />
          <span className="absolute top-1/3 left-6 right-10 h-px" style={{ backgroundColor: palette.ink, opacity: 0.4 }} />
          <span className="absolute top-1/3 right-8 h-2 w-2 rounded-full" style={{ backgroundColor: palette.ink, opacity: 0.6 }} />
          <span className="absolute bottom-6 right-8 h-10 w-10 rounded-full border" style={{ borderColor: palette.ink }} />
          <span className="absolute bottom-6 right-8 h-10 w-10 rounded-full border translate-x-2 -translate-y-2 opacity-30" style={{ borderColor: palette.ink }} />
        </>
      )}
      {post.category === "Engineering" && variant === 1 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
            <rect x="10" y="10" width="100" height="60" rx="4" stroke={palette.ink} strokeWidth="1.5" opacity="0.3" />
            <line x1="10" y1="30" x2="110" y2="30" stroke={palette.ink} strokeWidth="1" opacity="0.2" />
            <circle cx="30" cy="50" r="8" stroke={palette.ink} strokeWidth="1.5" fill="none" />
            <circle cx="70" cy="50" r="5" fill={palette.ink} opacity="0.4" />
            <line x1="40" y1="50" x2="62" y2="50" stroke={palette.ink} strokeWidth="1" opacity="0.5" />
            <rect x="80" y="42" width="16" height="16" rx="2" stroke={palette.ink} strokeWidth="1.5" fill="none" />
          </svg>
        </div>
      )}
      {post.category === "Engineering" && variant === 2 && (
        <>
          <div className="absolute top-6 left-6 right-6 flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-2 rounded-full flex-1" style={{ backgroundColor: palette.ink, opacity: i * 0.15 }} />
            ))}
          </div>
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
            {[40, 65, 35, 80, 50].map((h, i) => (
              <div key={i} className="w-4 rounded-t transition-all duration-500" style={{ height: `${h}%`, backgroundColor: palette.ink, opacity: 0.15 + (i % 2) * 0.2 }} />
            ))}
          </div>
        </>
      )}
      {post.category === "Engineering" && variant === 3 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-32 h-20 border-2 rounded-lg" style={{ borderColor: palette.ink }}>
              <div className="absolute top-2 left-2 right-2 h-1 rounded" style={{ backgroundColor: palette.ink, opacity: 0.2 }} />
              <div className="absolute top-5 left-2 right-8 h-1 rounded" style={{ backgroundColor: palette.ink, opacity: 0.15 }} />
              <div className="absolute bottom-2 left-2 w-12 h-1 rounded" style={{ backgroundColor: palette.ink, opacity: 0.1 }} />
            </div>
            <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: palette.ink, backgroundColor: palette.paper }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.ink }} />
            </div>
          </div>
        </div>
      )}
      {post.category === "Engineering" && variant === 4 && (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded border-2" style={{ borderColor: palette.ink }} />
                <div className="w-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.4 }} />
                <div className="w-8 h-8 rounded-full border-2" style={{ borderColor: palette.ink }} />
              </div>
              <div className="w-px h-6" style={{ backgroundColor: palette.ink, opacity: 0.3 }} />
              <div className="w-24 h-1 rounded" style={{ backgroundColor: palette.ink, opacity: 0.2 }} />
            </div>
          </div>
        </>
      )}
      {post.category === "Engineering" && variant === 5 && (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="w-6 h-6 rounded-sm transition-colors duration-300" style={{ backgroundColor: i % 3 === 0 ? palette.ink : palette.wash, opacity: i % 3 === 0 ? 0.3 : 0.6 }} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* ================================================================
          Typography (字体) - 6 variants
          ================================================================ */}
      {post.category === "Typography" && variant === 0 && (
        <>
          <div className="absolute inset-6 flex flex-col justify-center gap-4" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] font-mono tracking-widest w-8" style={{ color: palette.ink, opacity: 0.5 }}>{["H1", "H2", "P", "SM"][i]}</span>
                <span className="h-px flex-1" style={{ backgroundColor: palette.ink, opacity: 0.15 + i * 0.1, height: `${[3, 2, 1.5, 1][i]}px` }} />
                <span className="text-[9px] tracking-wide font-mono" style={{ color: palette.ink, opacity: 0.6 }}>{[24, 18, 15, 12][i]}px</span>
              </div>
            ))}
          </div>
          <span className="absolute bottom-3 right-5 text-6xl font-serif leading-none select-none" style={{ color: palette.ink, opacity: 0.08 }}>T</span>
        </>
      )}
      {post.category === "Typography" && variant === 1 && (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="block text-5xl font-serif italic leading-none" style={{ color: palette.ink, opacity: 0.15 }}>Aa</span>
              <div className="mt-4 flex gap-1 justify-center">
                {[0.3, 0.5, 0.7, 0.9].map((o, i) => (
                  <div key={i} className="w-8 h-1 rounded" style={{ backgroundColor: palette.ink, opacity: o }} />
                ))}
              </div>
            </div>
          </div>
          <span className="absolute bottom-4 left-6 text-[10px] font-mono tracking-widest" style={{ color: palette.ink, opacity: 0.4 }}>TYPOGRAPHY</span>
        </>
      )}
      {post.category === "Typography" && variant === 2 && (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-end gap-4">
              {["A", "B", "C", "D", "E"].map((letter, i) => (
                <span key={i} className="font-serif leading-none select-none transition-transform duration-500" style={{ color: palette.ink, opacity: 0.1 + i * 0.08, fontSize: `${20 + i * 8}px` }}>{letter}</span>
              ))}
            </div>
          </div>
          <div className="absolute bottom-6 left-6 right-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.2 }} />
        </>
      )}
      {post.category === "Typography" && variant === 3 && (
        <>
          <div className="absolute top-6 left-6">
            <span className="text-4xl font-serif italic leading-none" style={{ color: palette.ink, opacity: 0.12 }}>Ag</span>
          </div>
          <div className="absolute bottom-6 right-6 text-right">
            <div className="text-[9px] font-mono tracking-widest" style={{ color: palette.ink, opacity: 0.4 }}>12 / 16 / 24</div>
            <div className="flex gap-1 mt-1 justify-end">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-1" style={{ height: `${i * 4}px`, backgroundColor: palette.ink, opacity: 0.3 }} />
              ))}
            </div>
          </div>
        </>
      )}
      {post.category === "Typography" && variant === 4 && (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="text-8xl font-serif italic leading-none select-none" style={{ color: palette.ink, opacity: 0.08 }}>{initial}</div>
              <div className="absolute bottom-0 left-0 right-0 h-px" style={{ backgroundColor: palette.ink, opacity: 0.2 }} />
              <div className="absolute -bottom-3 left-0 text-[8px] font-mono" style={{ color: palette.ink, opacity: 0.4 }}>baseline</div>
            </div>
          </div>
        </>
      )}
      {post.category === "Typography" && variant === 5 && (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid grid-cols-5 gap-1">
              {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"].map((letter, i) => (
                <div key={i} className="w-6 h-6 flex items-center justify-center text-[10px] font-mono" style={{ color: palette.ink, opacity: 0.2 + (i % 3) * 0.1 }}>{letter}</div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ================================================================
          Frontend (前端) - 6 variants
          ================================================================ */}
      {post.category === "Frontend" && variant === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="absolute -top-5 -left-5 w-28 h-18 rounded-lg border bg-white/70 backdrop-blur-sm transition-transform duration-500 group-hover:-rotate-6" style={{ borderColor: palette.ink, transform: "rotate(-4deg)" }} />
            <div className="relative w-28 h-18 rounded-lg border flex items-center justify-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundColor: palette.wash, borderColor: palette.ink }}>
              <span className="text-3xl font-mono font-bold" style={{ color: palette.ink }}>{"</>"}</span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-24 h-3 rounded-full blur-sm" style={{ backgroundColor: palette.ink, opacity: 0.12 }} />
          </div>
        </div>
      )}
      {post.category === "Frontend" && variant === 1 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col gap-2 items-start">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: palette.ink, opacity: 0.6 }} />
              <span className="w-20 h-1.5 rounded" style={{ backgroundColor: palette.ink, opacity: 0.3 }} />
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: palette.ink, opacity: 0.4 }} />
              <span className="w-16 h-1.5 rounded" style={{ backgroundColor: palette.ink, opacity: 0.2 }} />
            </div>
            <div className="flex items-center gap-2 ml-8">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: palette.ink, opacity: 0.2 }} />
              <span className="w-12 h-1.5 rounded" style={{ backgroundColor: palette.ink, opacity: 0.15 }} />
            </div>
          </div>
        </div>
      )}
      {post.category === "Frontend" && variant === 2 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-3">
            <div className="w-16 h-12 rounded border-2" style={{ borderColor: palette.ink, backgroundColor: palette.wash }} />
            <div className="w-16 h-12 rounded border-2" style={{ borderColor: palette.ink }} />
            <div className="w-16 h-12 rounded border-2" style={{ borderColor: palette.ink }} />
            <div className="w-16 h-12 rounded border-2" style={{ borderColor: palette.ink, backgroundColor: palette.wash }} />
          </div>
        </div>
      )}
      {post.category === "Frontend" && variant === 3 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-32 h-20 rounded-lg border-2 overflow-hidden" style={{ borderColor: palette.ink }}>
              <div className="h-4 border-b flex items-center px-2 gap-1" style={{ borderColor: palette.ink, backgroundColor: palette.wash }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.ink, opacity: 0.4 }} />
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.ink, opacity: 0.3 }} />
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.ink, opacity: 0.2 }} />
              </div>
              <div className="p-2 space-y-1">
                <div className="h-1 rounded" style={{ backgroundColor: palette.ink, opacity: 0.2 }} />
                <div className="h-1 rounded w-3/4" style={{ backgroundColor: palette.ink, opacity: 0.15 }} />
                <div className="h-1 rounded w-1/2" style={{ backgroundColor: palette.ink, opacity: 0.1 }} />
              </div>
            </div>
          </div>
        </div>
      )}
      {post.category === "Frontend" && variant === 4 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed flex items-center justify-center" style={{ borderColor: palette.ink }}>
              <div className="text-center">
                <div className="text-2xl font-mono" style={{ color: palette.ink, opacity: 0.3 }}>{'<>'}</div>
                <div className="mt-2 flex gap-1 justify-center">
                  {[0.3, 0.5, 0.7].map((o, i) => (
                    <div key={i} className="w-6 h-1 rounded" style={{ backgroundColor: palette.ink, opacity: o }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {post.category === "Frontend" && variant === 5 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-2">
            {["div", "span", "p", "h1", "a", "img"].map((tag, i) => (
              <div key={i} className="px-2 py-1 rounded border text-center font-mono text-[10px]" style={{ borderColor: palette.ink, color: palette.ink, opacity: 0.3 + i * 0.1 }}>
                {tag}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================
          Snippet (点滴) - 6 variants
          ================================================================ */}
      {post.category === "Snippet" && variant === 0 && (
        <>
          <span className={`absolute top-6 h-24 w-24 rounded-full mix-blend-multiply ${shift}`} style={{ backgroundColor: palette.wash }} />
          <span className={`absolute top-12 h-16 w-16 rounded-full mix-blend-multiply ${tilt} left-1/2`} style={{ backgroundColor: palette.ink, opacity: 0.2 }} />
          <span className="absolute bottom-12 right-12 h-3 w-3 rounded-full" style={{ backgroundColor: palette.ink, opacity: 0.35 }} />
          <span className="absolute bottom-8 left-6 right-6 h-px" style={{ backgroundColor: palette.ink, opacity: 0.4 }} />
          <span className="absolute bottom-4 left-6 font-serif italic text-sm" style={{ color: palette.ink, opacity: 0.6 }}>No. {post.id.slice(0, 4)}</span>
        </>
      )}
      {post.category === "Snippet" && variant === 1 && (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-full" style={{ backgroundColor: palette.wash }} />
              <div className="w-10 h-10 rounded-full" style={{ backgroundColor: palette.ink, opacity: 0.2 }} />
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: palette.ink, opacity: 0.35 }} />
            </div>
          </div>
          <span className="absolute bottom-4 left-6 text-[10px] font-mono tracking-widest" style={{ color: palette.ink, opacity: 0.4 }}>SNIPPET</span>
        </>
      )}
      {post.category === "Snippet" && variant === 2 && (
        <>
          <div className="absolute top-8 left-8 right-8 bottom-8 border-2 rounded-lg" style={{ borderColor: palette.ink, opacity: 0.15 }} />
          <div className="absolute top-12 left-12 right-12 bottom-12 border rounded" style={{ borderColor: palette.ink, opacity: 0.1 }} />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-serif italic" style={{ color: palette.ink, opacity: 0.08 }}>{initial}</span>
          <span className="absolute bottom-6 left-6 text-[9px] font-mono tracking-widest" style={{ color: palette.ink, opacity: 0.4 }}>NOTE</span>
        </>
      )}
      {post.category === "Snippet" && variant === 3 && (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="block text-4xl font-serif italic leading-none mb-2" style={{ color: palette.ink, opacity: 0.1 }}>{initial}</span>
              <div className="w-8 h-0.5 mx-auto" style={{ backgroundColor: palette.ink, opacity: 0.3 }} />
            </div>
          </div>
          <span className="absolute bottom-4 left-6 text-[10px] tracking-widest" style={{ color: palette.ink, opacity: 0.4 }}>· · ·</span>
          <span className="absolute top-6 right-6 text-[9px] font-mono" style={{ color: palette.ink, opacity: 0.3 }}>{post.id.slice(0, 6)}</span>
        </>
      )}
      {post.category === "Snippet" && variant === 4 && (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: palette.ink, opacity: 0.3 }}>
                <span className="text-3xl font-serif italic" style={{ color: palette.ink, opacity: 0.15 }}>{initial}</span>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-px" style={{ backgroundColor: palette.ink, opacity: 0.3 }} />
            </div>
          </div>
        </>
      )}
      {post.category === "Snippet" && variant === 5 && (
        <>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-3 items-center">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.ink, opacity: 0.2 }} />
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: palette.ink, opacity: 0.3 }} />
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: palette.ink, opacity: 0.4 }} />
              <div className="w-8 h-8 rounded-full" style={{ backgroundColor: palette.ink, opacity: 0.5 }} />
              <div className="w-10 h-10 rounded-full" style={{ backgroundColor: palette.ink, opacity: 0.6 }} />
            </div>
          </div>
          <span className="absolute bottom-4 left-6 font-serif italic text-sm" style={{ color: palette.ink, opacity: 0.4 }}>· · ·</span>
        </>
      )}
    </div>
  );
});
