"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang-context";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  // P2-8：Hook 必须顶层无条件调用。旧实现把它包在 try/catch 内，违反 rules-of-hooks——
  // 一旦 Provider 缺失导致抛错被吞、或本组件后续新增 hook，就会出现两次渲染间
  // hook 数量不一致（"Rendered fewer hooks than expected"）。Provider 缺失应当显式暴露。
  const { t } = useLang()
  const siteName = t.siteName
  return (
    <nav className="flex items-center gap-1.5 text-[12px] text-[var(--yh-muted)] mb-6">
      <Link href="/" className="hover:text-[var(--yh-text)] transition-colors">
        {siteName}
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="text-[var(--yh-border)]">/</span>
          {item.href ? (
            <Link href={item.href} className="hover:text-[var(--yh-text)] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--yh-text)] font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
