"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/lang-context";
import { useSiteSettings } from "@/lib/settings-context";
import { pickTagline } from "@/lib/taglines";

export function Footer() {
  const { t, lang } = useLang();
  const [showTop, setShowTop] = useState(false);
  const [tagline, setTagline] = useState(t.footerTagline);
  // 站点设置下发：站名/页脚文案/社交链接（后台可改）；无值回退内置品牌
  const settings = useSiteSettings();
  const siteName = settings.siteName || "慢日志";
  const siteNameEn = settings.siteNameEn || "SLOWLOG";
  // 用户自定义页脚文案优先（按语言取对应侧）；未填时保留随机格言
  const motto = (lang === "zh" ? settings.footerText : settings.footerTextEn) || tagline;
  const socialLinks = settings.socialLinks;

  useEffect(() => {
    // P2-14：包 rAF + 值变更判断。旧实现每个 scroll 事件都 setState，
    // 即使 showTop 未变化也会触发整页（含全部卡片）重渲染
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const next = window.scrollY > 400;
        setShowTop((prev) => (prev === next ? prev : next));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    setTagline(pickTagline(lang));
  }, [lang]);

  return (
    <footer className="mt-auto w-full border-t border-[var(--yh-border)] bg-[var(--dash-card)]">
      {/* 单层页脚：左 = 品牌格言位，右 = 版权与技术位；窄屏自动堆叠 */}
      <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6 py-[11px] flex flex-col lg:flex-row items-center justify-between gap-[9px]">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="w-[22px] h-[22px] rounded-full bg-[var(--yh-text)] text-[var(--yh-bg)] flex items-center justify-center serif italic text-[11px]">S</span>
          <span className="font-medium">{siteName} · {siteNameEn}</span>
          <span className="mono text-[11px] px-1.5 py-0.5 rounded-none bg-[var(--dash-card)] border border-[var(--yh-border)] text-[var(--yh-muted)]">v{process.env.NEXT_PUBLIC_APP_VERSION || "0.5.0"}</span>
          <span className="hidden sm:inline mono text-[var(--yh-muted)]">— {motto}</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-[7px] mono text-[11px] text-[var(--yh-muted)]">
          <span>© {new Date().getFullYear()} Yahajiang</span>
          <span>·</span>
          <a href="mailto:yahajiang@gmail.com" className="hover:text-[var(--yh-text)] transition-colors">yahajiang@gmail.com</a>
          {socialLinks.map((s) => (
            <span key={s.url} className="flex items-center gap-[7px]">
              <span>·</span>
              {/* schema 层已限 http(s) 前缀，渲染前再守一道 */}
              <a href={/^https?:\/\//i.test(s.url) ? s.url : "#"} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--yh-text)] transition-colors">{s.name}</a>
            </span>
          ))}
          <span className="hidden md:inline">·</span>
          <span className="hidden md:inline">{t.footerBuilt}</span>
        </div>
      </div>
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 w-11 h-11 rounded-none bg-[var(--yh-text)] text-[var(--dash-bg)] flex items-center justify-center shadow-lg hover:bg-[var(--yh-accent)] transition-[background-color] duration-300 z-40 animate-[fadeIn_0.3s_var(--ease-out)]"
          aria-label="Back to top"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 12V4M4 7l4-4 4 4" />
          </svg>
        </button>
      )}
    </footer>
  );
}
