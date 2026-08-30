"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import type { Category } from "@/lib/categories";
import type { Post } from "@/lib/posts";
import { useLang } from "@/lib/lang-context";
import { Header } from "@/components/Header";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleArt } from "@/components/ArticleArt";
import { CategoryBadge } from "@/components/CategoryBadge";
import { AuthorAvatar } from "@/components/AuthorAvatar";
import { Thinking } from "@/components/Thinking";
import { Footer } from "@/components/Footer";

function catLabel(cat: string, t: ReturnType<typeof useLang>["t"]): string {
  if (cat === "All") return t.catAll;
  if (cat === "Design") return t.catDesign;
  if (cat === "Plugin") return t.catPlugin;
  if (cat === "Engineering") return t.catEngineering;
  if (cat === "Typography") return t.catTypography;
  if (cat === "Frontend") return t.catFrontend;
  if (cat === "Snippet") return t.catSnippet;
  return cat;
}

export default function HomeClient({ posts }: { posts: Post[] }) {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { t, lang } = useLang();

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

  const featured = posts.find((p) => p.featured);
  const localizedFeatured = featured
    ? lang === "zh"
      ? { ...featured, title: featured.titleZh || featured.title, excerpt: featured.excerptZh || featured.excerpt }
      : featured
    : null;
  const showHero =
    activeCategory === "All" && searchQuery.trim() === "" && localizedFeatured;
  const gridPosts = showHero
    ? localizedFiltered.filter((p) => !p.featured)
    : localizedFiltered;

  return (
    <div className="min-h-screen">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="sticky top-[65px] z-30 bg-[var(--yh-bg)]/80 backdrop-blur-xl border-b border-[var(--yh-border)]">
        <div className="max-w-6xl mx-auto px-6 flex items-center gap-0 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-3 text-xs tracking-widest uppercase whitespace-nowrap border-b-2 transition-all duration-300 ${
                activeCategory === cat
                  ? "border-zinc-900 text-zinc-900 font-semibold"
                  : "border-transparent text-[var(--yh-muted)] hover:text-[var(--yh-text)] font-medium"
              }`}
              style={{ transitionTimingFunction: "var(--ease-spring)" }}
            >
              {catLabel(cat, t)}
            </button>
          ))}
        </div>
      </div>

      {showHero && localizedFeatured && (
        <section className="border-b border-zinc-200 bg-white/60">
          <div className="max-w-6xl mx-auto px-6 py-8 md:py-10">
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div
                className="flex-1 min-w-0"
                style={{ animation: "fadeInUp 0.7s var(--ease-out) both" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <CategoryBadge category={localizedFeatured.category} />
                  <span className="text-[10px] tracking-widest uppercase text-zinc-400">
                    {t.featured}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold leading-tight tracking-tight text-zinc-900 mb-3">
                  {localizedFeatured.title}
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed mb-4 line-clamp-2">
                  {localizedFeatured.excerpt}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <AuthorAvatar initial={localizedFeatured.authorInitial} />
                    <div>
                      <p className="text-xs font-medium text-zinc-700">
                        {localizedFeatured.author}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {localizedFeatured.displayDate} · {localizedFeatured.readTime}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/posts/${localizedFeatured.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white text-[11px] tracking-widest uppercase hover:bg-zinc-700 transition-colors duration-300"
                    style={{ transitionTimingFunction: "var(--ease-spring)" }}
                  >
                    {t.readArticle} <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              <div
                className="hidden md:block w-48 shrink-0"
                style={{
                  animation: "fadeIn 0.8s var(--ease-out) both",
                  animationDelay: "150ms",
                }}
              >
                <div className="border border-zinc-200 overflow-hidden rounded-lg">
                  <ArticleArt post={localizedFeatured} tall />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {localizedFeatured.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] text-zinc-400 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section id="posts" className="max-w-[1400px] mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-zinc-900" />
            <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-semibold">
              {showHero
                ? t.latestArticles
                : activeCategory === "All"
                  ? t.allArticles
                  : catLabel(activeCategory, t)}
            </p>
            <span className="text-[11px] text-zinc-400">
              · {localizedFiltered.length}
            </span>
          </div>
          {searchQuery && (
            <p className="text-xs text-zinc-400">
              {t.resultsFor(searchQuery)}
            </p>
          )}
        </div>

        {gridPosts.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-zinc-200 bg-white">
            <p className="text-xl text-zinc-400 mb-2">
              {t.noArticles}
            </p>
            <p className="text-sm text-zinc-400">
              {t.noArticlesHint}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("All");
              }}
              className="mt-6 text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-900 transition-colors"
            >
              {t.clearFilters}
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {gridPosts.map((post, idx) => (
              <ArticleCard key={post.id} post={post} index={idx} />
            ))}
          </div>
        )}
      </section>

      {showHero && <Thinking />}

      {showHero && (
        <section className="max-w-3xl mx-auto px-6 pb-8">
          <div className="border border-zinc-200 bg-white p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-900">
                {t.browseTimeline}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {t.timelineDesc(posts.length)}
              </p>
            </div>
            <Link
              href="#posts"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("posts")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs tracking-widest uppercase border border-zinc-900 px-4 py-2 hover:bg-zinc-900 hover:text-white transition-colors"
            >
              {t.viewAll}
            </Link>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
