"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/lang-context";
import { pickTagline } from "@/lib/taglines";

/**
 * 全站导航过场骨架（纸纹 + 装订线 + 扫光骨架卡，与欢迎幕/错误页同语言）。
 *
 * ⚠️ 作用域纪律（2026-09-15 审查 F1 实证）：loading.tsx 是流式 Suspense 边界，
 * 会**先冲刷 200 状态头**——凡包住它的路由，页面后抛的 notFound() 只能内联渲染
 * 404 UI 而改不了状态码（soft-404，SEO 灾难）。因此本骨架只允许出现在
 * `(shell)` 路由组（首页/归档/登录等**永notFound 的列表页**），
 * `/posts`、`/m/posts`、`/t/posts`、`/tag` 等会 404 的详情段**不得**包 loading 边界。
 */
export default function LoadingShell() {
  const { t, lang } = useLang();
  const [tagline, setTagline] = useState(t.footerTagline);
  useEffect(() => {
    setTagline(pickTagline(lang));
  }, [lang]);
  // 扫光基元：基色块不位移，光带挂 after 伪元素（与 loading/DashLoading 同款规范）
  const sk = "overflow-hidden relative after:absolute after:inset-0 after:content-[''] after:animate-[shimmer_1.8s_var(--ease-in-out)_infinite] after:bg-[linear-gradient(90deg,transparent_0%,rgba(254,253,250,0.75)_50%,transparent_100%)] after:bg-[length:200%_100%]";
  return (
    <div role="status" aria-label={t.loading} className="min-h-screen bg-[var(--yh-bg)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* 纸纹 + 装订线：与欢迎幕/错误页同语言 */}
      <div className="paper-grain" aria-hidden />
      <span aria-hidden className="tick tick-tl" />
      <span aria-hidden className="tick tick-tr" />
      <span aria-hidden className="tick tick-bl" />
      <span aria-hidden className="tick tick-br" />

      <div className="w-full max-w-[min(70%,1600px)] mx-auto flex flex-col items-center gap-10 relative">
        {/* 品牌行 */}
        <div className="flex flex-col items-center gap-5 animate-[fadeIn_0.5s_var(--ease-out)_both]">
          <span className="w-11 h-11 rounded-full bg-[var(--yh-text)] text-[var(--yh-bg)] flex items-center justify-center serif italic text-[16px] shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
            S
          </span>
          <span className="mono text-[13px] tracking-[0.16em] uppercase text-[var(--yh-muted)]">
            慢日志 · SLOWLOG
          </span>
          <span className="block h-px w-16 bg-gradient-to-r from-transparent via-[var(--yh-accent)]/50 to-transparent" />
        </div>

        {/* 骨架卡：封面块 + 三行递减 + meta 行，杂志页心 */}
        <div className="w-full max-w-md bg-[var(--dash-card)] border border-[var(--yh-border)] rounded-none p-8 shadow-[var(--shadow-card)] animate-[fadeInUp_0.55s_var(--ease-out)_both] [animation-delay:80ms]">
          <div className={`w-full aspect-[16/7] bg-[var(--yh-border)]/35 border border-[var(--yh-border)]/60 mb-6 ${sk}`} />
          <div className="space-y-5">
            <div className={`h-[10px] w-full bg-[var(--yh-border)]/55 ${sk}`} />
            <div className={`h-[10px] w-3/4 bg-[var(--yh-border)]/40 ${sk} after:[animation-delay:180ms]`} />
            <div className={`h-[10px] w-1/2 bg-[var(--yh-border)]/28 ${sk} after:[animation-delay:360ms]`} />
            <div className="pt-3 flex items-center gap-2">
              <span className="w-8 h-px bg-[var(--yh-accent)]/40" />
              <span className="h-[10px] w-24 bg-[var(--yh-border)]/30" />
            </div>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--yh-accent)] animate-[pulse_1.6s_var(--ease-in-out)_infinite]" />
            <p className="mono text-[12px] tracking-[0.16em] uppercase text-[var(--yh-muted)]">{t.loading}</p>
          </div>
        </div>

        <p className="mono text-[12px] tracking-wide text-[var(--yh-muted)]/55 animate-[fadeIn_0.6s_var(--ease-out)_both] [animation-delay:200ms]">
          {tagline}
        </p>
      </div>
    </div>
  );
}
