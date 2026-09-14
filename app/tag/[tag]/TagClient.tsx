"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { CategoryBadge } from "@/components/CategoryBadge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SearchButton } from "@/components/SearchButton";
import { useLang } from "@/lib/lang-context";
import { catLabel } from "@/components/HomeClient";
import { mdInSiteTz } from "@/lib/relative-time";

export type TagItem = {
  id: string;
  title: string;
  titleZh: string | null;
  category: string;
  readTime: string | null;
  date: string;
};

// 标签聚合页客户端：TAG 刊头 + 分类分布（本地化徽章）+ 相关标签 + 行列表
export function TagClient({ tagName, items, related }: { tagName: string; items: TagItem[]; related: string[] }) {
  const { t, lang } = useLang();
  const zh = lang === "zh";

  const catCounts = new Map<string, number>();
  for (const p of items) catCounts.set(p.category, (catCounts.get(p.category) || 0) + 1);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--yh-bg)]">
      {/* 顶栏：与归档同款语言 */}
      <div className="sticky top-0 z-40 h-[53px] bg-[var(--yh-bg)]/80 backdrop-blur-xl border-b border-[var(--yh-border)]">
        <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-60 transition-opacity">
            <span className="w-[26px] h-[26px] rounded-full bg-[var(--yh-text)] text-[var(--yh-bg)] flex items-center justify-center serif italic text-[12px] shrink-0">S</span>
            <span className="flex items-baseline gap-1">
              <span className="font-semibold text-[15px] tracking-tight">慢日志</span>
              <span className="mono text-[12px] tracking-[0.14em] uppercase">· SLOWLOG</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <SearchButton />
            <LanguageSwitcher />
            <Link
              href="/archive"
              className="mono text-[12px] tracking-[0.14em] uppercase text-[var(--yh-muted)] hover:text-[var(--yh-text)] transition-colors border border-[var(--yh-border)] px-3 py-[5px] bg-[var(--dash-card)] rounded-none"
            >
              {zh ? "归档" : "Archive"}
            </Link>
          </div>
        </div>
      </div>

      {/* 刊头：TAG 眉题 + 大号衬线标签 + 分类分布 + 相关标签 */}
      <main className="flex-1">
      <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6 pt-8 pb-6">
        <p className="mono text-[10px] tracking-[0.24em] uppercase text-[var(--yh-accent)]">
          Tag · {zh ? "标签聚合" : "Collection"}
        </p>
        <h1 className="serif text-[38px] font-semibold tracking-tight mt-2 leading-tight">
          <span className="text-[var(--yh-accent)] mr-1">#</span>
          {tagName}
        </h1>
        <p className="mono text-[11px] tracking-wide text-[var(--yh-muted)] mt-2">
          {zh ? `${items.length} 篇文章` : `${items.length} ${items.length === 1 ? "post" : "posts"}`}
        </p>

        <div className="flex items-center flex-wrap gap-2 mt-4">
          {[...catCounts.entries()].map(([c, n]) => (
            <span
              key={c}
              className={`art-${c} inline-flex items-center gap-1.5 px-2.5 py-1 border text-[10px] font-semibold tracking-widest uppercase rounded-none`}
              style={{ backgroundColor: "var(--ap)", color: "var(--ai)", borderColor: "var(--aw)" }}
            >
              {catLabel(c, t)} <span className="mono opacity-60">{n}</span>
            </span>
          ))}
        </div>

        {related.length > 0 && (
          <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1.5 mt-4 pt-3 border-t border-[var(--yh-border)]/60">
            <span className="mono text-[9px] tracking-[0.22em] uppercase text-[var(--yh-muted)]">{zh ? "相关标签" : "Related"}</span>
            {related.map((tg) => (
              <Link
                key={tg}
                href={`/tag/${encodeURIComponent(tg)}`}
                className="mono text-[11px] text-[var(--yh-muted)] hover:text-[var(--yh-accent)] transition-colors"
              >
                #{tg}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 列表：与归档列表行同语言 */}
      <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6 pb-16 flex-1">
        <div className="border border-[var(--yh-border)] bg-[var(--dash-card)] p-6 rounded-none">
          <div className="space-y-2">
            {items.map((p) => {
              const md = mdInSiteTz(p.date);
              const title = zh ? (p.titleZh || p.title) : p.title;
              return (
                <Link
                  key={p.id}
                  href={`/posts/${p.id}`}
                  className="group flex items-center gap-4 py-2 border-b border-[var(--yh-border)]/50 last:border-0 hover:bg-[var(--yh-bg)]/50 px-2 -mx-2"
                >
                  <span className="mono text-[11px] text-[var(--yh-muted)] w-12 shrink-0">{md}</span>
                  <span className="text-sm truncate flex-1 group-hover:text-[var(--yh-accent)] group-hover:underline underline-offset-4">{title}</span>
                  <span className="hidden sm:block">
                    <CategoryBadge category={p.category} />
                  </span>
                  <span className="mono text-[10px] text-[var(--yh-muted)] hidden sm:block">{p.readTime || ""}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--yh-border)] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-[var(--yh-accent)] transition-all duration-200 shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      </main>
      <Footer />
    </div>
  );
}
