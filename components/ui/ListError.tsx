"use client"
import { useLang } from "@/lib/lang-context"

// 后台列表加载失败的唯一呈现：说明 + 重试。与空状态区分开——
// 空是「没有数据」，这是「拿不到数据」，两者混成一个白面板是链路断点。
export function ListError({ onRetry }: { onRetry: () => void }) {
  const { t } = useLang()
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-4 px-4 py-5 border border-[var(--dash-danger-border)] bg-[var(--dash-danger-soft)]"
    >
      <p className="text-sm text-[var(--dash-danger)]">{t.errorLoad}</p>
      <button
        onClick={onRetry}
        className="min-h-[48px] px-4 text-sm font-medium rounded-none border border-[var(--dash-border)] bg-[var(--dash-card)] text-[var(--dash-text)] hover:bg-[var(--dash-bg)] active:opacity-80 transition-[background-color,opacity] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dash-accent)]"
      >
        {t.errorRetry}
      </button>
    </div>
  )
}
