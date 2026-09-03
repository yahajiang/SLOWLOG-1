"use client";

import { useLang } from "@/lib/lang-context";

interface MFooterProps {
  /** 对应的桌面端地址（“桌面版”按钮跳转用） */
  desktopHref: string;
}

/** 移动端脚页：Logo 双语锁死 + 版本 + 链接纵向堆叠 + 桌面版切换 */
export function MFooter({ desktopHref }: MFooterProps) {
  const { t } = useLang();

  function goDesktop() {
    document.cookie = "view=desktop; path=/; max-age=31536000";
    window.location.href = desktopHref;
  }

  return (
    <footer className="mt-auto w-full border-t border-[var(--yh-border)] bg-[var(--dash-card)]">
      <div className="w-full mx-auto px-4 py-4 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center serif italic text-[10px]">S</span>
          <span className="font-medium">慢日志 · SLOWLOG</span>
          <span className="mono text-[10px] px-1.5 py-0.5 rounded-none bg-[var(--dash-card)] border border-[var(--yh-border)] text-[var(--yh-muted)]">v{process.env.NEXT_PUBLIC_APP_VERSION || "0.2.0"}</span>
        </div>
        <p className="mono text-[11px] text-[var(--yh-muted)]">— {t.siteSlogan}</p>
        <div className="flex items-center gap-4 mono text-[11px] text-[var(--yh-muted)]">
          <a href="mailto:yahajiang@gmail.com" className="hover:text-[var(--yh-text)] transition-colors">yahajiang@gmail.com</a>
          <a href="https://github.com/yahajiang" target="_blank" className="hover:text-[var(--yh-text)] transition-colors">GitHub</a>
        </div>
        <p className="mono text-[10px] text-[var(--yh-muted)]">© {new Date().getFullYear()} Yahajiang · {t.footerBuilt}</p>
        <button
          onClick={goDesktop}
          className="mono text-[11px] tracking-[0.14em] uppercase px-4 py-2 rounded-none border border-[var(--yh-border)] bg-[var(--dash-card)] text-[var(--yh-muted)] hover:text-[var(--yh-text)] active:bg-zinc-100 transition-colors"
        >
          桌面版
        </button>
      </div>
    </footer>
  );
}
