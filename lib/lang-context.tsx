"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
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

  // ⚠️ value 必须 memo：原先写成内联对象字面量，每次 Provider 渲染都产生新引用，
  // 于是所有 useLang() 消费者跟着重渲染。平时看不出来，但 Tiptap v3 的 `useEditor`
  // 会在选项引用变化时销毁重建实例 —— 编辑器停在「加载编辑器…」永不挂载
  //（2026-09-30 实测：给 TiptapEditor 加 useLang 后必现，去掉即恢复）。
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("yh-lang", l);
      document.documentElement.lang = l === "en" ? "en" : "zh-CN";
    } catch {}
  }, []);

  const value = useMemo<LangCtx>(() => ({ lang, setLang, t: getDict(lang) }), [lang, setLang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be inside LangProvider");
  return ctx;
}
