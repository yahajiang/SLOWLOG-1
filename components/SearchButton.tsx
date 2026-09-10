"use client";

import { Search } from "lucide-react";

// 全局搜索入口按钮（client）：dispatch 事件由根布局的 SearchPanel 监听。
// 供 server 组件页面（如标签聚合页）使用——server 组件不能直接传 onClick。
export function SearchButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("sl-open-search"))}
      className="w-[34px] h-[30px] flex items-center justify-center border border-[var(--yh-border)] bg-[var(--dash-card)] text-[var(--yh-muted)] hover:text-[var(--yh-text)] hover:border-[var(--yh-muted)] transition-colors rounded-none"
      aria-label="全局搜索"
      title="全局搜索（/）"
    >
      <Search className="w-3.5 h-3.5" />
    </button>
  );
}
