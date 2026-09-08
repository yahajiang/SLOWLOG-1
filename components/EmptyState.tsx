import Link from "next/link";
import React from "react";

// 统一空态（v0.3 细节统一）：dashed 直角卡 + 印章符号 + 标题 + 提示 + 可选行动出口。
// 归档空态 / 搜索无果 / 标签空集等处复用，替代各处手写的纯文字空态。
export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border border-dashed border-[var(--yh-border)] bg-[var(--dash-card)]/60 px-8 py-12 text-center rounded-none">
      <div className="w-10 h-10 mx-auto mb-3 border border-[var(--yh-border)] bg-[var(--dash-card)] flex items-center justify-center serif italic text-[15px] text-[var(--yh-muted)] rotate-[-4deg]" aria-hidden>
        ∅
      </div>
      <p className="text-sm font-medium text-[var(--yh-text)]">{title}</p>
      {hint && <p className="text-xs text-[var(--yh-muted)] mt-1.5">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
