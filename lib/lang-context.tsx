"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Lang } from "./i18n";
import { getDict, type Dict } from "./i18n";

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const LangContext = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("zh");

  // 界面双语策略：UI 文案双语，文章内容以中文为主——
  // html lang 随界面语言同步，保证屏幕阅读器按正确语言发音（a11y）
  function applyDocumentLang(l: Lang) {
    try {
      document.documentElement.lang = l === "en" ? "en" : "zh-CN"
    } catch {}
  }

  useEffect(() => {
    const saved = localStorage.getItem("yh-lang") as Lang | null;
    const l: Lang = saved === "en" || saved === "zh" ? saved : "zh";
    setLangState(l);
    applyDocumentLang(l);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("yh-lang", l);
    applyDocumentLang(l);
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: getDict(lang) }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be inside LangProvider");
  return ctx;
}
