"use client";

import { useLang } from "@/lib/lang-context";

interface LanguageSwitcherProps {
  /** sm=移动 44px 触控；md=桌面紧凑（默认） */
  size?: "sm" | "md";
  /** ghost=无边框（与 ThemeToggle 幽灵风格统一，用于侧边栏控件组） */
  ghost?: boolean;
}

export function LanguageSwitcher({ size = "md", ghost = false }: LanguageSwitcherProps) {
  const { lang, setLang, t } = useLang();

  return (
    <button
      onClick={() => setLang(lang === "zh" ? "en" : "zh")}
      className={
        ghost
          ? "mono text-[12px] tracking-[0.14em] uppercase px-3 h-11 min-w-[44px] flex items-center justify-center rounded-none text-[var(--yh-muted)] hover:text-[var(--yh-text)] hover:bg-[var(--yh-border)]/40 active:bg-[var(--yh-border)] transition-colors font-medium"
          : size === "sm"
          ? "mono text-[12px] tracking-[0.14em] uppercase px-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-none border border-[var(--yh-border)] bg-[var(--dash-card)] hover:border-[var(--yh-muted)] hover:bg-[var(--dash-card)] active:bg-[var(--yh-border)] transition-colors font-medium"
          : "mono text-[12px] tracking-[0.14em] uppercase px-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-none border border-[var(--yh-border)] bg-[var(--dash-card)] hover:border-[var(--yh-muted)] hover:bg-[var(--dash-card)] transition-colors font-medium"
      }
      title={lang === "zh" ? t.switchToEn : t.switchToZh}
      aria-label={lang === "zh" ? t.switchToEn : t.switchToZh}
    >
      {lang === "zh" ? "EN" : "中"}
    </button>
  );
}
