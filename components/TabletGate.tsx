"use client";

/**
 * 平板访客一次性引导（桌面树挂载）：
 * 视口 768–1366 且粗指针（触屏）、无 view 偏好 cookie → 种 view=tablet 并转 /t。
 * sessionStorage 防循环（cookie 写入失败的私有模式兜底）；/m、/t、后台不干预。
 */
import { useEffect } from "react";

export function TabletGate() {
  useEffect(() => {
    try {
      const p = window.location.pathname;
      if (p.startsWith("/m") || p.startsWith("/t") || p.startsWith("/api") || p.startsWith("/dashboard")) return;
      if (document.cookie.includes("view=")) return;
      if (window.sessionStorage.getItem("tl-gated")) return;
      if (!window.matchMedia("(min-width: 768px) and (max-width: 1366px) and (pointer: coarse)").matches) return;
      document.cookie = "view=tablet; path=/; max-age=31536000; samesite=lax";
      window.sessionStorage.setItem("tl-gated", "1");
      window.location.replace(p === "/" ? "/t" : "/t" + p);
    } catch {}
  }, []);
  return null;
}
