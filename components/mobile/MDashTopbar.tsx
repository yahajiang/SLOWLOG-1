"use client";

import { useLang } from "@/lib/lang-context";

export function MDashTopbar({ userName }: { userName: string }) {
  const { t } = useLang();
  return (
    <div className="sticky top-0 z-40 bg-[var(--dash-card)]/95 backdrop-blur-xl border-b border-[var(--dash-border)]">
      <div className="w-full mx-auto px-4 h-14 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[var(--yh-text)] text-[var(--yh-bg)] flex items-center justify-center serif italic text-[11px] shrink-0">S</span>
          <span className="font-semibold text-[14px] tracking-tight text-[var(--dash-text)]">{t.dashBrand}</span>
        </span>
        <span className="mono text-[10px] tracking-[0.14em] uppercase text-[var(--dash-muted)]">
          {userName}
        </span>
      </div>
    </div>
  );
}
