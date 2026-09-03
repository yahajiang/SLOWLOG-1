"use client";

import { useEffect, useState } from "react";

/**
 * 响应式媒体查询 hook
 * SSR 安全：服务端返回 fallback，客户端 mount 后再检测
 */
export function useMediaQuery(query: string, fallback = false): boolean {
  const [matches, setMatches] = useState(fallback);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** 移动端检测：viewport < 768px (md 断点) */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)", false);
}
