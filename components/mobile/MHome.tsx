"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ArticleArt } from "@/components/ArticleArt";
import { CategoryBadge } from "@/components/CategoryBadge";
import { AuthorAvatar } from "@/components/AuthorAvatar";
import { useLang } from "@/lib/lang-context";
import { formatDisplayDate } from "@/lib/relative-time";
import { MHeader } from "./MHeader";
import { MFooter } from "./MFooter";
import { MArticleCard } from "./MArticleCard";
import { mCatLabel } from "@/lib/madapt";

function MThoughts() {
  const { t, lang } = useLang();
  const [thoughts, setThoughts] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    fetch("/api/thoughts")
      .then((r) => r.json())
      .then((d) => setThoughts(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);
  if (thoughts.length === 0) return null;
  // 默认只展示 4 条，其余折叠（与桌面同款）
  const VISIBLE = 4;
  const hidden = thoughts.length - VISIBLE;
  const shown = expanded ? thoughts : thoughts.slice(0, VISIBLE);
  return (
    <section className="w-full mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-px w-7 bg-zinc-900" />
        <p className="text-[11px] uppercase tracking-widest text-[var(--yh-muted)] font-semibold">
          {t.thinking}
        </p>
      </div>
      <div className="space-y-3">
        {shown.map((th) => (
          <div key={th.id} className="bg-[var(--dash-card)] border border-[var(--yh-border)] rounded-none px-4 py-3">
            <p className="text-[14px] text-[var(--yh-text)] leading-[1.8]">
              {lang === "zh" ? th.contentZh || th.content : th.content}
            </p>
            <p className="mono text-[10px] text-[var(--yh-muted)] mt-2">
              {new Date(th.createdAt).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
        ))}
      </div>
      {hidden > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 w-full mono text-[11px] tracking-[0.14em] uppercase px-5 py-3 border border-[var(--yh-border)] bg-[var(--dash-card)] text-[var(--yh-muted)] active:text-[var(--yh-text)] transition-colors rounded-none min-h-[44px]"
        >
          {expanded
            ? (lang === "zh" ? "收起" : "Collapse")
            : (lang === "zh" ? `展开更多 · ${hidden} 条` : `Show more · ${hidden}`)}
        </button>
      )}
    </section>
  );
}

function MTimeline({ posts }: { posts: any[] }) {
  const { t, lang } = useLang();
  const recent = useMemo(() => {
    return [...posts]
      .sort(
        (a, b) =>
          new Date((b as any).publishedAt || (b as any).createdAt || (b as any).date).getTime() -
          new Date((a as any).publishedAt || (a as any).createdAt || (a as any).date).getTime()
      )
      .slice(0, 6);
  }, [posts]);
  if (recent.length === 0) return null;
  const year = new Date(
    (recent[0] as any).publishedAt || (recent[0] as any).createdAt || (recent[0] as any).date
  ).getFullYear();
  return (
    <section className="w-full mx-auto px-4 pb-8">
      <div className="border border-[var(--yh-border)] bg-[var(--dash-card)] p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-zinc-900">{t.browseTimeline}</p>
            <p className="text-xs text-[var(--yh-muted)] mt-1">{t.timelineDesc(posts.length)}</p>
          </div>
          <Link
            href="/m/archive"
            className="text-xs tracking-widest uppercase border border-zinc-900 px-3 py-2 hover:bg-zinc-900 hover:text-white transition-colors shrink-0"
          >
            {t.viewAll}
          </Link>
        </div>
        <p className="mono text-[10px] tracking-[0.14em] uppercase text-[var(--yh-muted)] mb-1.5">
          {year} · {t.postsCount2(recent.length)}
        </p>
        <div className="space-y-1">
          {recent.map((p: any) => {
            const d = new Date(p.publishedAt || p.createdAt || p.date);
            const md = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            return (
              <Link key={p.id} href={`/m/posts/${p.id}`} className="flex items-center gap-2 text-[13px] py-1">
                <span className="mono text-[10px] text-[var(--yh-muted)] w-10 shrink-0">{md}</span>
                <span className="truncate">{lang === "zh" ? p.titleZh || p.title : p.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** 移动端首页：搜索顶栏 + 分类横滑 + Hero + 单列列表 + 随想 + 时间线 */
export function MHome({ posts, categories: dbCategories }: { posts: any[]; categories?: any[] }) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { t, lang } = useLang();

  const allCats: string[] = dbCategories?.length
    ? ["All", ...dbCategories.map((c: any) => c.name as string).filter((c) => c !== "All")]
    : ["All", "Design", "Plugin", "Engineering", "Typography", "Frontend", "Snippet"];

  const filtered = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory = activeCategory === "All" || post.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        (post.title || "").toLowerCase().includes(q) ||
        (post.titleZh || "").toLowerCase().includes(q) ||
        (post.excerpt || "").toLowerCase().includes(q) ||
        (post.excerptZh || "").toLowerCase().includes(q) ||
        (post.tags || []).some((x: string) => x.toLowerCase().includes(q)) ||
        (post.category || "").toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [posts, activeCategory, searchQuery]);

  const featured = useMemo(() => posts.find((p) => p.featured) || posts[0] || null, [posts]);
  const showHero = activeCategory === "All" && searchQuery.trim() === "" && featured;
  const heroTitle = featured ? (lang === "zh" ? featured.titleZh || featured.title : featured.title) : "";
  const heroExcerpt = featured ? (lang === "zh" ? featured.excerptZh || featured.excerpt : featured.excerpt) : "";
  const heroDate = featured ? formatDisplayDate(featured.date, lang) : "";

  return (
    <div data-m="1" className="min-h-screen flex flex-col bg-[var(--yh-bg)]">
      <MHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} showAdmin />

      <div className="sticky top-14 z-30 bg-[var(--yh-bg)]/90 backdrop-blur-xl border-b border-[var(--yh-border)]">
        <div className="flex items-center gap-1 overflow-x-auto px-4 h-11" style={{ scrollbarWidth: "none" }}>
          {allCats.map((cat) => {
            const dbCat = dbCategories?.find((c: any) => c.name === cat);
            const label = dbCat ? (lang === "zh" ? dbCat.nameZh || cat : cat) : mCatLabel(cat, t);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-3 mono text-[11px] tracking-[0.14em] uppercase whitespace-nowrap border-b-2 transition-colors min-h-[44px] ${
                  activeCategory === cat
                    ? "border-[var(--yh-accent)] text-[var(--yh-accent)] font-semibold"
                    : "border-transparent text-[var(--yh-muted)] font-medium"
                }`}
              >
                {label}
              </button>
            );
          })}
          <Link
            href="/m/archive"
            className="ml-1 px-3 py-1.5 mono text-[11px] tracking-[0.14em] uppercase whitespace-nowrap rounded-none border border-[var(--yh-border)] bg-[var(--dash-card)] text-[var(--yh-muted)] shrink-0 self-center"
          >
            {t.archiveTitle} →
          </Link>
        </div>
      </div>

      {showHero && (
        <section className="border-b border-[var(--yh-border)] bg-[var(--dash-card)]/60">
          <div className="px-4 py-6">
            <div className="border border-[var(--yh-border)] overflow-hidden rounded-none mb-4">
              <ArticleArt post={featured} tall />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <CategoryBadge category={featured.category} />
              <span className="text-[10px] tracking-widest uppercase text-[var(--yh-muted)]">{t.featured}</span>
            </div>
            <h2 className="serif text-[22px] font-semibold leading-tight tracking-[-0.02em] text-zinc-900 mb-2">
              {heroTitle}
            </h2>
            <p className="text-sm text-[var(--yh-muted)] leading-relaxed mb-4 line-clamp-2">{heroExcerpt}</p>
            <div className="flex items-center gap-2 mb-4">
              <AuthorAvatar initial={featured.authorInitial} />
              <div>
                <p className="text-xs font-medium text-zinc-700">{featured.author}</p>
                <p className="text-[11px] text-[var(--yh-muted)]">{heroDate} · {featured.readTime}</p>
              </div>
            </div>
            <Link
              href={`/m/posts/${featured.id}`}
              className="flex items-center justify-center gap-1.5 w-full px-4 py-3 bg-zinc-900 text-white text-[12px] tracking-widest uppercase"
            >
              {t.readArticle} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      <section id="posts" className="w-full mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-7 bg-zinc-900" />
          <p className="text-[11px] uppercase tracking-widest text-[var(--yh-muted)] font-semibold">
            {showHero ? t.latestArticles : activeCategory === "All" ? t.allArticles : lang === "zh"
              ? dbCategories?.find((c: any) => c.name === activeCategory)?.nameZh || mCatLabel(activeCategory, t)
              : mCatLabel(activeCategory, t)}
          </p>
          <span className="text-[11px] text-[var(--yh-muted)]">· {filtered.length}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-[var(--yh-border)] bg-[var(--dash-card)]">
            <p className="text-base text-[var(--yh-muted)] mb-2">{t.noArticles}</p>
            <p className="text-sm text-[var(--yh-muted)]">{t.noArticlesHint}</p>
            <button
              type="button"
              onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
              className="mt-5 text-sm text-[var(--yh-muted)] underline underline-offset-4 min-h-[44px] px-4"
            >
              {t.clearFilters}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((post) => (
              <MArticleCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      {showHero && <MThoughts />}
      {showHero && <MTimeline posts={posts} />}

      <MFooter desktopHref="/" />
    </div>
  );
}
