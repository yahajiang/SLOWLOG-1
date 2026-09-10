"use client";

import { useLang } from "@/lib/lang-context";

export default function Loading() {
  const { t } = useLang();
  return (
    <div className="min-h-screen bg-[var(--yh-bg)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* 纸纹：与欢迎幕同语言 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply"
        style={{
          backgroundImage:
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23g)'/%3E%3C/svg%3E")`,
          backgroundSize: "240px 240px",
        }}
      />
      <div className="w-full max-w-[min(70%,1600px)] mx-auto flex flex-col items-center gap-10 relative">
        {/* 品牌行 */}
        <div className="flex flex-col items-center gap-5 animate-[fadeIn_0.5s_var(--ease-out)_both]">
          <span className="w-11 h-11 rounded-full bg-[var(--yh-text)] text-[var(--yh-bg)] flex items-center justify-center serif italic text-[16px] shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
            S
          </span>
          <span className="mono text-[13px] tracking-[0.16em] uppercase text-[var(--yh-muted)]">
            慢日志 · SLOWLOG
          </span>
          <span className="block h-px w-16 bg-gradient-to-r from-transparent via-[var(--yh-accent)]/50 to-transparent" />
        </div>

        {/* 骨架卡：杂志页心，错峰微光 */}
        <div className="w-full max-w-md bg-[var(--dash-card)] border border-[var(--yh-border)] rounded-none p-10 shadow-[var(--shadow-card)] animate-[fadeInUp_0.55s_var(--ease-out)_both] [animation-delay:80ms]">
          <div className="space-y-5">
            <div className="h-[10px] w-full bg-[var(--yh-border)]/55 overflow-hidden relative after:absolute after:inset-0 after:content-[''] after:animate-[shimmer_1.8s_var(--ease-in-out)_infinite] after:bg-[linear-gradient(90deg,transparent_0%,rgba(254,253,250,0.75)_50%,transparent_100%)] after:bg-[length:200%_100%]" />
            <div className="h-[10px] w-3/4 bg-[var(--yh-border)]/40 overflow-hidden relative after:absolute after:inset-0 after:content-[''] after:animate-[shimmer_1.8s_var(--ease-in-out)_infinite] after:[animation-delay:180ms] after:bg-[linear-gradient(90deg,transparent_0%,rgba(254,253,250,0.75)_50%,transparent_100%)] after:bg-[length:200%_100%]" />
            <div className="h-[10px] w-1/2 bg-[var(--yh-border)]/28 overflow-hidden relative after:absolute after:inset-0 after:content-[''] after:animate-[shimmer_1.8s_var(--ease-in-out)_infinite] after:[animation-delay:360ms] after:bg-[linear-gradient(90deg,transparent_0%,rgba(254,253,250,0.75)_50%,transparent_100%)] after:bg-[length:200%_100%]" />
            <div className="pt-3 flex items-center gap-2">
              <span className="w-8 h-px bg-[var(--yh-accent)]/40" />
              <span className="h-[10px] w-24 bg-[var(--yh-border)]/30" />
            </div>
          </div>
          <div className="mt-10 flex items-center justify-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--yh-accent)] animate-[pulse_1.6s_var(--ease-in-out)_infinite]" />
            <p className="mono text-[12px] tracking-[0.16em] uppercase text-[var(--yh-muted)]">{t.loading}</p>
          </div>
        </div>

        <p className="mono text-[12px] tracking-wide text-[var(--yh-muted)]/55 animate-[fadeIn_0.6s_var(--ease-out)_both] [animation-delay:200ms]">
          {t.footerTagline}
        </p>
      </div>
    </div>
  );
}
