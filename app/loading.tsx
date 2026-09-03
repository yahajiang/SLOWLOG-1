"use client";

import { useLang } from "@/lib/lang-context";

export default function Loading() {
  const { t } = useLang();
  return (
    <div className="min-h-screen bg-[var(--yh-bg)] flex items-center justify-center p-6">
      <div className="w-full max-w-[min(70%,1600px)] mx-auto flex flex-col items-center gap-9 animate-[pageIn_0.4s_var(--ease-out)_both]">
        <div className="flex items-center gap-4">
          <span className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center serif italic text-[15px]">S</span>
          <span className="mono text-[15px] tracking-[0.14em] uppercase text-[var(--yh-muted)]">慢日志 · SLOWLOG</span>
        </div>
        <div className="w-full max-w-lg bg-[var(--dash-card)] border border-[var(--yh-border)] rounded-none p-9 shadow-[var(--shadow-card)]">
          <div className="space-y-4">
            <div className="h-3 w-full bg-[var(--yh-border)]/60 rounded-none animate-[shimmer_1.5s_var(--ease-out)_infinite]" style={{ backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)", backgroundSize: "200% 100%" }} />
            <div className="h-3 w-3/4 bg-[var(--yh-border)]/40 rounded-none animate-[shimmer_1.5s_var(--ease-out)_infinite] [animation-delay:200ms]" style={{ backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)", backgroundSize: "200% 100%" }} />
            <div className="h-3 w-1/2 bg-[var(--yh-border)]/30 rounded-none animate-[shimmer_1.5s_var(--ease-out)_infinite] [animation-delay:400ms]" style={{ backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)", backgroundSize: "200% 100%" }} />
          </div>
          <div className="mt-9 flex items-center justify-center gap-3">
            <span className="w-2 h-2 rounded-none bg-[var(--yh-accent)] animate-[pulse_1.2s_var(--ease-out)_infinite]" />
            <p className="mono text-[15px] tracking-[0.14em] uppercase text-[var(--yh-muted)]">{t.loading}</p>
          </div>
        </div>
        <p className="mono text-[13px] tracking-wide text-[var(--yh-muted)]/60">{t.footerTagline}</p>
      </div>
    </div>
  );
}
