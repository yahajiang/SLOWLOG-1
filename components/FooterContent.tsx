"use client";

import { useLang } from "@/lib/lang-context";

export function FooterContent() {
  const { t } = useLang();

  return (
    <>
      <p className="text-sm text-[var(--yh-muted)] tracking-wide">
        {t.footerSlogan}
      </p>
      <div className="flex items-center gap-3 text-xs text-[var(--yh-muted)]">
        <span>&copy; 2024-{new Date().getFullYear()} Yahajiang</span>
        <span className="text-[var(--yh-border)]">·</span>
        <a
          href="https://github.com/yahajiang"
          target="_blank"
          className="hover:text-[var(--yh-text)] transition-colors"
        >
          GitHub
        </a>
        <span className="text-[var(--yh-border)]">·</span>
        <span>SlowLog v1.0</span>
      </div>
    </>
  );
}
