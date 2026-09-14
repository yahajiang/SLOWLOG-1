"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useLang } from "@/lib/lang-context";

interface ThemeToggleProps {
  /** sm=移动 44px 触控；md=桌面 30px 视觉（默认） */
  size?: "sm" | "md";
  /** icon=纯图标钮（默认）；row=侧边栏全宽行（图标+文字，与导航行同款） */
  variant?: "icon" | "row";
}

// 主题切换器（v0.4 暗色模式）：☀/☾ 循环切换，偏好持久化（sl-theme），
// 首帧 class 由 layout 内联脚本同步（本组件只管切换与图标态）。
// 初始 dark 态从 html.dark class 推断（内联脚本已设置）。
export function ThemeToggle({ size = "md", variant = "icon" }: ThemeToggleProps) {
  const [dark, setDark] = useState(false);
  const { lang } = useLang();

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

  const box = "w-11 h-11";
  const icon = size === "sm" ? 18 : 15;
  const label = dark ? (lang === "zh" ? "日间模式" : "Light mode") : lang === "zh" ? "夜间模式" : "Dark mode";
  const Icon = dark ? (
    <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ) : (
    <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );

  if (variant === "row") {
    // 侧边栏全宽行：与导航/前台/登出行完全同款
    return (
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--dash-muted)] hover:text-[var(--dash-text)] hover:bg-[var(--dash-bg)] transition-colors rounded-none"
        aria-label={label}
        title={label}
      >
        {Icon}
        <span className="whitespace-nowrap">{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`${box} flex items-center justify-center text-[var(--yh-muted)] hover:text-[var(--yh-text)] active:bg-[var(--yh-border)] transition-colors`}
      aria-label={dark ? "切换到日间" : "切换到夜间"}
      title={dark ? "切换到日间" : "切换到夜间"}
    >
      {Icon}
    </button>
  );
}
