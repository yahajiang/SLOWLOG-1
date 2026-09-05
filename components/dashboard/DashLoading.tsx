// 后台加载态：沿用主站「加载」的设计语言——S 圆标 + 品牌字 + accent 呼吸点 +「加载中」mono 小标，
// 内容区由各路由的 loading.tsx 传入对应的骨架变体（按页面真实占位大小取形）。
// compact 模式用于移动端：顶栏已有品牌标识，这里只保留呼吸点 + 加载小字。
export function DashLoading({
  children,
  compact = false,
}: {
  children: React.ReactNode
  compact?: boolean
}) {
  if (compact) {
    return (
      <div className="animate-[pageIn_0.4s_var(--ease-out)_both]">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="w-1.5 h-1.5 bg-[var(--yh-accent)] animate-[pulse_1.2s_var(--ease-out)_infinite]" />
          <span className="mono text-[11px] tracking-[0.14em] uppercase text-[var(--yh-muted)]">加载中</span>
        </div>
        {children}
      </div>
    )
  }
  return (
    <div className="animate-[pageIn_0.4s_var(--ease-out)_both]">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-[26px] h-[26px] rounded-full bg-zinc-900 text-white flex items-center justify-center serif italic text-[11px]">S</span>
        <span className="mono text-[12px] tracking-[0.14em] uppercase text-[var(--yh-muted)]">慢日志 · SLOWLOG</span>
        <span className="w-1.5 h-1.5 bg-[var(--yh-accent)] animate-[pulse_1.2s_var(--ease-out)_infinite]" />
        <span className="mono text-[12px] tracking-[0.14em] uppercase text-[var(--yh-muted)]/70">加载中</span>
      </div>
      {children}
    </div>
  )
}
