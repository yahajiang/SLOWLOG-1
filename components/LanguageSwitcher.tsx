"use client";

import { useLang } from "@/lib/lang-context";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLang();

  return (
    <button
      onClick={() => setLang(lang === "zh" ? "en" : "zh")}
      className="mono text-[12px] tracking-[0.14em] uppercase px-3 py-[5px] rounded-none border border-[var(--yh-border)] bg-[var(--dash-card)] hover:border-zinc-400 hover:bg-[var(--dash-card)] transition-colors font-medium"
      title={lang === "zh" ? t.switchToEn : t.switchToZh}
    >
      {lang === "zh" ? "EN" : "中"}
    </button>
  );
}
