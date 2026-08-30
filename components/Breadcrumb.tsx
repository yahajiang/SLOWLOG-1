"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang-context";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const { t } = useLang();
  return (
    <nav className="flex items-center gap-1.5 text-[12px] text-[var(--yh-muted)] mb-6">
      <Link href="/" className="hover:text-[var(--yh-text)] transition-colors">
        {t.siteName}
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="text-zinc-300">/</span>
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
