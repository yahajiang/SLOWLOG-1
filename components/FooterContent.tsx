"use client";

import { useLang } from "@/lib/lang-context";

export function FooterContent() {
  const { t } = useLang();

  return (
    <>
      <p className="text-xs text-[var(--yh-muted)] tracking-wide opacity-70">
        {t.footerSlogan}
      </p>
      <div className="flex items-center gap-2 text-[11px] text-[var(--yh-muted)]">
        <span>&copy; {new Date().getFullYear()} Yahajiang</span>
        <span className="opacity-30">·</span>
        <a
          href="https://github.com/yahajiang"
          target="_blank"
          className="hover:text-[var(--yh-text)] transition-colors opacity-70 hover:opacity-100"
        >
          GitHub
        </a>
        <span className="opacity-30">·</span>
        <a
          href="https://slowlog.vercel.app"
          target="_blank"
          className="hover:text-[var(--yh-text)] transition-colors opacity-70 hover:opacity-100"
        >
          SlowLog
        </a>
      </div>
    </>
  );
}
