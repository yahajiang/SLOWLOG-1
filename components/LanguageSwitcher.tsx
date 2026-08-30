"use client";

import { useLang } from "@/lib/lang-context";

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <button
      onClick={() => setLang(lang === "zh" ? "en" : "zh")}
      className="text-[10px] tracking-widest uppercase px-2.5 py-1.5 border border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50 transition-colors font-medium"
      title={lang === "zh" ? "Switch to English" : "切换到中文"}
    >
      {lang === "zh" ? "EN" : "中"}
    </button>
  );
}
