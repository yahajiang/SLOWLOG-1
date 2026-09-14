"use client";

import { useLang } from "@/lib/lang-context";

import { Languages } from "lucide-react";

interface LanguageSwitcherProps {
  /** sm=移动 44px 触控；md=桌面紧凑（默认） */
  size?: "sm" | "md";
  /** ghost=无边框（与 ThemeToggle 幽灵风格统一，用于侧边栏控件组） */
  ghost?: boolean;
  /** icon=纯图标/文字钮（默认）；row=侧边栏全宽行 */
  variant?: "icon" | "row";
}

export function LanguageSwitcher({ size = "md", ghost = false, variant = "icon" }: LanguageSwitcherProps) {
  const { lang, setLang, t } = useLang();

  if (variant === "row") {
    return (
      <button
        onClick={() => setLang(lang === "zh" ? "en" : "zh")}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--dash-muted)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-bg)] transition-colors rounded-none"
        title={lang === "zh" ? t.switchToEn : t.switchToZh}
        aria-label={lang === "zh" ? t.switchToEn : t.switchToZh}
      >
        <Languages className="w-4 h-4 shrink-0" />
        <span className="whitespace-nowrap">{lang === "zh" ? "语言" : "Language"}</span>
        <span className="ml-auto mono text-[11px] tracking-[0.14em] uppercase">{lang === "zh" ? "中" : "EN"}</span>
      </button>
    );
  }

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
