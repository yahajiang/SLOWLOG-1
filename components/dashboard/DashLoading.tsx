"use client";

import { useLang } from "@/lib/lang-context";

// 后台加载态：沿用主站「加载」的设计语言——S 圆标 + 品牌字 + accent 呼吸点 + mono 小标，
// 内容区由各路由的 loading.tsx 传入对应的骨架变体（按页面真实占位大小取形）。
// compact 模式用于移动端：顶栏已有品牌标识，这里只保留呼吸点 + 加载小字。
// section-in：路由切换时加载壳淡入上移，与主站板块进入同语感。
// ⚠️ 必须是客户端边界：loading.tsx 本身是 RSC，拿不到 LangProvider。主站壳 LoadingShell
// 早就是 client + t.loading，本组件此前是唯一还硬编码「加载中」的加载态。
export function DashLoading({
  children,
  compact = false,
}: {
  children: React.ReactNode
  compact?: boolean
}) {
  const { t } = useLang();
  if (compact) {
    return (
      <div className="section-in">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="w-1.5 h-1.5 bg-[var(--yh-accent)] animate-[pulse_1.2s_var(--ease-out)_infinite]" />
          <span className="mono text-[11px] tracking-[0.14em] uppercase text-[var(--yh-muted)]">{t.loading}</span>
        </div>
        {children}
      </div>
    )
  }
  return (
    <div className="section-in">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-[26px] h-[26px] rounded-full bg-[var(--yh-text)] text-[var(--yh-bg)] flex items-center justify-center serif italic text-[11px]">S</span>
        <span className="mono text-[12px] tracking-[0.14em] uppercase text-[var(--yh-muted)]">慢日志 · SLOWLOG</span>
        <span className="w-1.5 h-1.5 bg-[var(--yh-accent)] animate-[pulse_1.2s_var(--ease-out)_infinite]" />
        <span className="mono text-[12px] tracking-[0.14em] uppercase text-[var(--yh-muted)]/70">{t.loading}</span>
      </div>
      {children}
    </div>
  )
}
