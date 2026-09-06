"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CATEGORIES, ART_PALETTES, CAT_ABBR } from "@/lib/categories";
import type { Category } from "@/lib/categories";
import type { Post } from "@/lib/types";
import { formatDisplayDate } from "@/lib/relative-time";
import { useLang } from "@/lib/lang-context";
import { Header } from "@/components/Header";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleArt } from "@/components/ArticleArt";
import { CategoryBadge } from "@/components/CategoryBadge";
import { AuthorAvatar } from "@/components/AuthorAvatar";
import { Thinking } from "@/components/Thinking";
import { Footer } from "@/components/Footer";

export function catLabel(cat: string, t: ReturnType<typeof useLang>["t"]): string {
  if (cat === "All") return t.catAll;
  if (cat === "Design") return t.catDesign;
  if (cat === "Plugin") return t.catPlugin;
  if (cat === "Engineering") return t.catEngineering;
  if (cat === "Typography") return t.catTypography;
  if (cat === "Frontend") return t.catFrontend;
  if (cat === "Snippet") return t.catSnippet;
  return cat;
}

export default function HomeClient({ posts, categories: dbCategories }: { posts: Post[]; categories?: any[] }) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { t, lang } = useLang();
  const displayCategories: string[] = dbCategories
    ? dbCategories.map((c: any) => c.name as string)
    : ([...CATEGORIES] as string[])
  // ensure All is first
  const allCats = displayCategories[0] === "All" ? displayCategories : ["All", ...displayCategories.filter((c) => c !== "All")]

  const filtered = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory =
        activeCategory === "All" || post.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        post.title.toLowerCase().includes(q) ||
        post.titleZh.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.excerptZh.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q)) ||
        post.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [posts, activeCategory, searchQuery]);

  const localizedFiltered = filtered.map((p) =>
    lang === "zh"
      ? { ...p, title: p.titleZh || p.title, excerpt: p.excerptZh || p.excerpt }
      : p
  );

  const featuredPosts = useMemo(() => posts.filter((p) => p.featured), [posts])
  const [heroIndex, setHeroIndex] = useState(0)
  const featured = featuredPosts[heroIndex] || null
  const localizedFeatured = featured
    ? lang === "zh"
      ? { ...featured, title: featured.titleZh || featured.title, excerpt: featured.excerptZh || featured.excerpt }
      : featured
    : null
  // 多篇推荐时自动轮播
  useEffect(() => {
    if (featuredPosts.length <= 1) return
    const id = setInterval(() => setHeroIndex((i) => (i + 1) % featuredPosts.length), 5000)
    return () => clearInterval(id)
  }, [featuredPosts.length])
  useEffect(() => { setHeroIndex(0) }, [featuredPosts.length])
  const showHero = activeCategory === "All" && searchQuery.trim() === "" && localizedFeatured
  const gridPosts = localizedFiltered

  // All 且无搜索时：按分类分 Section
  const groupedByCategory = useMemo(() => {
    if (activeCategory !== "All" || searchQuery.trim() !== "") return null
    const order = allCats.filter((c) => c !== "All")
    const groups = order
      .map((cat) => ({ cat, posts: localizedFiltered.filter((p) => p.category === cat) }))
      .filter((g) => g.posts.length > 0)
    // 未归类
    const knownIds = new Set(groups.flatMap((g) => g.posts.map((p) => p.id)))
    const leftover = localizedFiltered.filter((p) => !knownIds.has(p.id))
    if (leftover.length) groups.push({ cat: "Other", posts: leftover })
    return groups
  }, [localizedFiltered, activeCategory, searchQuery, allCats])
  const isGrouped = !!groupedByCategory && groupedByCategory.length > 1

  return (
    <div className="min-h-screen flex flex-col">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="flex-1 flex flex-col">

      <div className="sticky top-[63px] z-30 bg-[var(--yh-bg)]/80 backdrop-blur-xl border-b border-[var(--yh-border)]">
        <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6 flex items-center gap-0 overflow-x-auto scrollbar-none">
          {allCats.map((cat) => {
            const dbCat = dbCategories?.find((c: any) => c.name === cat)
            const label = dbCat ? (lang === "zh" ? dbCat.nameZh || cat : cat) : catLabel(cat, t)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-3 mono text-[11px] tracking-[0.14em] uppercase whitespace-nowrap border-b-2 transition-colors duration-200 ${
                  activeCategory === cat
                    ? "border-[var(--yh-accent)] text-[var(--yh-accent)] font-semibold"
                    : "border-transparent text-[var(--yh-muted)] hover:text-[var(--yh-text)] font-medium"
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {showHero && localizedFeatured && (
        <section className="border-b border-[var(--yh-border)] bg-[var(--dash-card)]/60 backdrop-blur-sm relative overflow-hidden">
          <div className="max-w-[min(70%,1600px)] mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row md:items-center gap-5 animate-[fadeInUp_0.5s_var(--ease-out)_both]" key={heroIndex}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <CategoryBadge category={localizedFeatured.category} />
                  <span className="text-[10px] tracking-widest uppercase text-[var(--yh-muted)]">{t.featured}</span>
                  {featuredPosts.length > 1 && (
                    <span className="flex items-center gap-1 text-[10px] text-[var(--yh-muted)]">
                      <button
                        onClick={() => setHeroIndex((i) => (i - 1 + featuredPosts.length) % featuredPosts.length)}
                        className="px-1.5 py-1 hover:text-[var(--yh-accent)] transition-colors min-h-[24px]"
                        aria-label="上一篇推荐"
                      >
                        ‹
                      </button>
                      {heroIndex + 1} / {featuredPosts.length}
                      <button
                        onClick={() => setHeroIndex((i) => (i + 1) % featuredPosts.length)}
                        className="px-1.5 py-1 hover:text-[var(--yh-accent)] transition-colors min-h-[24px]"
                        aria-label="下一篇推荐"
                      >
                        ›
                      </button>
                    </span>
                  )}
                </div>
                <h2 className="serif text-[26px] font-semibold leading-tight tracking-[-0.02em] text-zinc-900 mb-3">
                  {localizedFeatured.title}
                </h2>
                <p className="text-sm text-[var(--yh-muted)] leading-relaxed mb-4 line-clamp-2">{localizedFeatured.excerpt}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <AuthorAvatar initial={localizedFeatured.authorInitial} />
                    <div>
                      <p className="text-xs font-medium text-zinc-700">{localizedFeatured.author}</p>
                      <p className="text-[11px] text-[var(--yh-muted)]">{formatDisplayDate(localizedFeatured.date, lang)} · {localizedFeatured.readTime}</p>
                    </div>
                  </div>
                  <Link href={`/posts/${localizedFeatured.id}`} className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white text-[11px] tracking-widest uppercase hover:bg-zinc-700 transition-colors duration-300 [transition-timing-function:var(--ease-spring)]">
                    {t.readArticle} <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
              <div className="hidden md:block w-48 shrink-0 animate-[fadeIn_0.6s_var(--ease-out)_both] [animation-delay:100ms]" key={`art-${heroIndex}`}>
                <div className="border border-[var(--yh-border)] overflow-hidden rounded-none shadow-[var(--shadow-card)]">
                  <ArticleArt post={localizedFeatured} tall />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {localizedFeatured.tags.map((tag) => (
                    <span key={tag} className="text-[10px] text-[var(--yh-muted)] bg-[var(--dash-card)] border border-[var(--yh-border)] px-2 py-0.5 rounded-none">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {featuredPosts.length > 1 && (
            <>
              <button onClick={() => setHeroIndex((i) => (i - 1 + featuredPosts.length) % featuredPosts.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[var(--dash-card)]/90 backdrop-blur border border-[var(--yh-border)] rounded-none flex items-center justify-center hover:bg-white shadow-sm" aria-label="prev">
                ‹
              </button>
              <button onClick={() => setHeroIndex((i) => (i + 1) % featuredPosts.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[var(--dash-card)]/90 backdrop-blur border border-[var(--yh-border)] rounded-none flex items-center justify-center hover:bg-white shadow-sm" aria-label="next">
                ›
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {featuredPosts.map((_, i) => (
                  <button key={i} onClick={() => setHeroIndex(i)} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === heroIndex ? "bg-zinc-900" : "bg-zinc-300"}`} />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <section id="posts" className="w-full max-w-[min(70%,1600px)] mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-zinc-900" />
            <p className="text-[11px] uppercase tracking-widest text-[var(--yh-muted)] font-semibold">
              {showHero
                ? t.latestArticles
                : activeCategory === "All"
                  ? t.allArticles
                  : lang === "zh" ? (dbCategories?.find((c: any) => c.name === activeCategory)?.nameZh || catLabel(activeCategory, t)) : catLabel(activeCategory, t)}
            </p>
            <span className="text-[11px] text-[var(--yh-muted)]">
              · {localizedFiltered.length}
            </span>
          </div>
          {searchQuery && (
            <p className="text-xs text-[var(--yh-muted)]">
              {t.resultsFor(searchQuery)}
            </p>
          )}
        </div>

        {gridPosts.length === 0 ? (
          showHero && posts.length === 1 ? (
            <div className="py-12 text-center border border-dashed border-[var(--yh-border)] bg-[var(--dash-card)]">
              <p className="text-sm text-[var(--yh-muted)]">仅 1 篇推荐文章已在上方展示</p>
              <p className="text-xs text-[var(--yh-muted)] mt-1">再发布一篇将在此显示</p>
            </div>
          ) : (
            <div className="py-20 text-center border border-dashed border-[var(--yh-border)] bg-[var(--dash-card)]">
              <p className="text-xl text-[var(--yh-muted)] mb-2">
                {t.noArticles}
              </p>
              <p className="text-sm text-[var(--yh-muted)]">
                {t.noArticlesHint}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                }}
                className="mt-6 text-xs text-[var(--yh-muted)] underline underline-offset-4 hover:text-zinc-900 transition-colors"
              >
                {t.clearFilters}
              </button>
            </div>
          )
        ) : isGrouped && groupedByCategory ? (
          <div className="space-y-10">
            {groupedByCategory.map((group) => {
              const palette: any = (ART_PALETTES as any)[group.cat] || { paper: "#F8F7F4", ink: "#2B2926", wash: "#E8E2DA", accent: "#C9A98A" }
              const abbr = (CAT_ABBR as any)[group.cat] || group.cat.slice(0, 3).toUpperCase()
              const label = lang === "zh" ? (dbCategories?.find((c: any) => c.name === group.cat)?.nameZh || catLabel(group.cat, t)) : catLabel(group.cat, t)
              return (
                <div key={group.cat}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px w-7" style={{ backgroundColor: palette.ink }} />
                    <span className="text-[11px] tracking-[0.18em] uppercase font-semibold px-2.5 py-1 rounded-none border" style={{ backgroundColor: palette.paper, borderColor: palette.wash, color: palette.ink }}>
                      {label} · {abbr}
                    </span>
                    <span className="text-[11px] text-[var(--yh-muted)]">· {t.postsCount2(group.posts.length)}</span>
                    <div className="flex-1 h-px bg-zinc-100 ml-2 hidden sm:block" />
                    <button type="button" onClick={() => setActiveCategory(group.cat)} className="text-[11px] tracking-widest uppercase text-[var(--yh-muted)] border border-[var(--yh-border)] px-3 py-1 rounded-none hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-colors">
                      {t.viewAllGrouped}
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {group.posts.map((post, idx) => (
                      <ArticleCard key={post.id} post={post} index={idx} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {gridPosts.map((post, idx) => (
              <ArticleCard key={post.id} post={post} index={idx} />
            ))}
          </div>
        )}
      </section>

      {showHero && <Thinking />}

      {showHero && (
        <section className="w-full max-w-[min(63%,1440px)] mx-auto px-6 pb-7">
          <div className="border border-[var(--yh-border)] bg-[var(--dash-card)] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {t.browseTimeline}
                </p>
                <p className="text-xs text-[var(--yh-muted)] mt-1">
                  {t.timelineDesc(posts.length)}
                </p>
              </div>
              <Link
                href="/archive"
                className="text-xs tracking-widest uppercase border border-zinc-900 px-4 py-2 hover:bg-zinc-900 hover:text-white transition-colors shrink-0"
              >
                {t.viewAll}
              </Link>
            </div>
            {(() => {
              const byYear = new Map<number, typeof posts>()
              for (const p of [...posts].sort((a,b)=> new Date((b as any).publishedAt||(b as any).createdAt||(b as any).date).getTime() - new Date((a as any).publishedAt||(a as any).createdAt||(a as any).date).getTime())) {
                const y = new Date((p as any).publishedAt || (p as any).createdAt || (p as any).date).getFullYear()
                if (!byYear.has(y)) byYear.set(y, [])
                byYear.get(y)!.push(p)
              }
              const years = [...byYear.entries()].sort((a,b)=> b[0]-a[0]).slice(0,2)
              const recent = years.flatMap(([,arr])=> arr).slice(0,8)
              const grouped = new Map<number, typeof posts>()
              for (const p of recent) {
                const y = new Date((p as any).publishedAt || (p as any).createdAt || (p as any).date).getFullYear()
                if (!grouped.has(y)) grouped.set(y, [])
                grouped.get(y)!.push(p)
              }
              return (
                <div className="space-y-3">
                  {[...grouped.entries()].sort((a,b)=> b[0]-a[0]).map(([year, arr]) => (
                    <div key={year}>
                      <p className="mono text-[10px] tracking-[0.14em] uppercase text-[var(--yh-muted)] mb-1.5">{year} · {t.postsCount2(arr.length)}</p>
                      <div className="space-y-1">
                        {arr.map((p)=> {
                          const d = new Date((p as any).publishedAt || (p as any).createdAt || (p as any).date)
                          const md = `${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
                          return (
                            <Link key={p.id} href={`/posts/${p.id}`} className="flex items-center gap-2 text-[13px] hover:text-[var(--yh-accent)] group">
                              <span className="mono text-[10px] text-[var(--yh-muted)] w-10 shrink-0">{md}</span>
                              <span className="truncate group-hover:underline underline-offset-4">{lang==="zh" ? (p.titleZh||p.title) : p.title}</span>
                              <span className="ml-auto mono text-[10px] text-[var(--yh-muted)] hidden sm:block">{catLabel(p.category, t)}</span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  {posts.length>8 && <p className="mono text-[10px] text-[var(--yh-muted)] pt-2 border-t border-[var(--yh-border)]/50">{t.expandThoughts(posts.length-8)}</p>}
                </div>
              )
            })()}
          </div>
        </section>
      )}

      <Footer />
    </div>
    </div>
  );
}
