import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SearchButton } from "@/components/SearchButton";
import { CategoryBadge } from "@/components/CategoryBadge";
import { getAllPosts } from "@/lib/posts";

// 标签聚合页（v0.3 P1-7）：/tag/[tag]——文章页底部标签可点击进入，
// 视觉复用归档语言（顶栏 + 标题区 + 年份无关的行列表）。
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const name = decodeURIComponent(tag);
  return { title: `#${name}`, description: `标签「${name}」下的全部文章` };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const name = decodeURIComponent(tag);
  const all = await getAllPosts();
  const hits = all
    .filter((p) => (p.tags || []).some((x) => x.toLowerCase() === name.toLowerCase()))
    .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());

  if (hits.length === 0) notFound();

  const catCounts = new Map<string, number>();
  for (const p of hits) catCounts.set(p.category, (catCounts.get(p.category) || 0) + 1);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--yh-bg)]">
      <div className="sticky top-0 z-40 h-[53px] bg-[var(--yh-bg)]/80 backdrop-blur-xl border-b border-[var(--yh-border)]">
        <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-60 transition-opacity">
            <span className="w-[26px] h-[26px] rounded-full bg-zinc-900 text-white flex items-center justify-center serif italic text-[12px] shrink-0">S</span>
            <span className="flex items-baseline gap-1">
              <span className="font-semibold text-[15px] tracking-tight">慢日志</span>
              <span className="mono text-[12px] tracking-[0.14em] uppercase">· SLOWLOG</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <SearchButton />
            <LanguageSwitcher />
            <Link href="/archive" className="mono text-[12px] tracking-[0.14em] uppercase text-[var(--yh-muted)] hover:text-[var(--yh-text)] transition-colors border border-[var(--yh-border)] px-3 py-[5px] bg-white rounded-none">
              归档
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6 py-6">
        <h1 className="serif text-[32px] font-semibold tracking-tight">
          <span className="text-[var(--yh-accent)] mr-1">#</span>
          {name}
        </h1>
        <p className="mono text-[11px] tracking-wide text-[var(--yh-muted)] mt-2">
          {hits.length} 篇
          {[...catCounts.entries()].map(([c, n]) => ` · ${c} ${n}`).join("")}
        </p>
      </div>

      <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6 pb-16 flex-1">
        <div className="border border-[var(--yh-border)] bg-[var(--dash-card)] p-6 rounded-none">
          <div className="space-y-2">
            {hits.map((p) => {
              const d = new Date(p.publishedAt || p.createdAt);
              const md = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              const title = p.titleZh || p.title;
              return (
                <Link key={p.id} href={`/posts/${p.id}`} className="group flex items-center gap-4 py-2 border-b border-[var(--yh-border)]/50 last:border-0 hover:bg-[var(--yh-bg)]/50 px-2 -mx-2">
                  <span className="mono text-[11px] text-[var(--yh-muted)] w-12 shrink-0">{md}</span>
                  <span className="text-sm truncate flex-1 group-hover:text-[var(--yh-accent)] group-hover:underline underline-offset-4">{title}</span>
                  <span className="hidden sm:block"><CategoryBadge category={p.category} /></span>
                  <span className="mono text-[10px] text-[var(--yh-muted)] hidden sm:block">{p.readTime || ""}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-[var(--yh-accent)] transition-all duration-200 shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
