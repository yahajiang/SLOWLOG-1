"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang-context";

/**
 * 前台分页条（归档 / 标签页 / 移动归档共用）。
 *
 * - 页码用 <Link>（而非 onClick + router.push）：爬虫可抓取、可中键新开、可预取
 * - href 由调用方给出（各页查询串不同），组件只负责渲染与省略逻辑
 * - 单页时整体不渲染（只在 totalPages > 1 出现）
 */
export function Pagination({
  page,
  totalPages,
  hrefFor,
  className = "",
}: {
  page: number;
  totalPages: number;
  hrefFor: (p: number) => string;
  className?: string;
}) {
  const { t } = useLang();
  if (totalPages <= 1) return null;

  // 页码窗口：首末页常驻，当前页 ±1，其余以省略号折叠
  const pages: (number | "…")[] = [];
  const push = (p: number) => { if (!pages.includes(p)) pages.push(p); };
  push(1);
  for (let p = page - 1; p <= page + 1; p++) {
    if (p > 1 && p < totalPages) push(p);
  }
  push(totalPages);
  const ordered: (number | "…")[] = [];
  [...pages].sort((a, b) => (a as number) - (b as number)).forEach((p, i, arr) => {
    const prev = arr[i - 1] as number | undefined;
    if (prev !== undefined && (p as number) - prev > 1) ordered.push("…");
    ordered.push(p);
  });

  const base =
    "min-h-[44px] min-w-[40px] px-3 inline-flex items-center justify-center mono text-[12px] tracking-[0.14em] uppercase border rounded-none transition-colors";
  const idle = "border-[var(--yh-border)] text-[var(--yh-muted)] hover:text-[var(--yh-text)] hover:bg-[var(--yh-bg)]";
  const active = "border-[var(--yh-text)] bg-[var(--yh-text)] text-[var(--yh-bg)]";
  const disabled = "border-[var(--yh-border)] text-[var(--yh-border)] pointer-events-none";

  return (
    <nav className={`flex items-center justify-center gap-2 ${className}`} aria-label="pagination">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={`${base} ${idle}`}>
          {t.pagePrev}
        </Link>
      ) : (
        <span className={`${base} ${disabled}`} aria-hidden>{t.pagePrev}</span>
      )}

      {ordered.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-[var(--yh-muted)] mono text-[12px]">…</span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={`${base} ${p === page ? active : idle}`}
          >
            {p}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={`${base} ${idle}`}>
          {t.pageNext}
        </Link>
      ) : (
        <span className={`${base} ${disabled}`} aria-hidden>{t.pageNext}</span>
      )}

      <span className="ml-1 mono text-[11px] text-[var(--yh-muted)]">{t.pageStatus(page, totalPages)}</span>
    </nav>
  );
}
