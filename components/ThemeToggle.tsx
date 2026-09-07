"use client";

import { useEffect, useState } from "react";

// 主题切换器（v0.4 暗色模式）：☀/☾ 循环切换，偏好持久化（sl-theme），
// 首帧 class 由 layout 内联脚本同步（本组件只管切换与图标态）。
// 初始 dark 态从 html.dark class 推断（内联脚本已设置）。
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("sl-theme", next ? "dark" : "light");
    } catch {}
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", next ? "#14110d" : "#fefdfa");
    setDark(next);
  }

  return (
    <button
      onClick={toggle}
      className="w-[30px] h-[30px] flex items-center justify-center text-[var(--yh-muted)] hover:text-[var(--yh-text)] transition-colors"
      aria-label={dark ? "切换到日间" : "切换到夜间"}
      title={dark ? "切换到日间" : "切换到夜间"}
    >
      {dark ? (
        // 日间图标（太阳）
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        // 夜间图标（月）
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
