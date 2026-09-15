"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ChevronRight, Search } from "lucide-react"
import { Footer } from "@/components/Footer"
import { CategoryBadge } from "@/components/CategoryBadge"
import { EmptyState } from "@/components/EmptyState"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useLang } from "@/lib/lang-context"
import { mdInSiteTz } from "@/lib/relative-time"

// 归档页 = 查看全部的终点：真时间线（Motion 02 生长 + Motion 05 阅读）
// 轴线随滚动生长（scaleY），节点进入视口依次点亮，文章从节点侧淡入。
// 渐进增强：`tl-armed` 类由 JS 挂载——无 JS / 爬虫拿到的是完全可见的静态列表。
export default function ArchiveClient({ posts, years }: { posts: any[]; years: [number, any[]][] }) {
  const { t, lang } = useLang()
  const [q, setQ] = useState("")
  const [armed, setArmed] = useState(false)
  const [grow, setGrow] = useState(0)
  const tlRef = useRef<HTMLDivElement>(null)
  // P2-13：title / category 均可能缺失（历史脏数据），统一兜底为空串——
  // 否则 .toLowerCase() 抛 TypeError 会让整页白屏
  const filteredYears = q.trim()
    ? years.map(([y, arr]) => [y, arr.filter((p:any)=> ((p.titleZh||p.title||"") as string).toLowerCase().includes(q.toLowerCase()) || ((p.category||"") as string).toLowerCase().includes(q.toLowerCase()))] as [number, any[]]).filter(([,arr])=> arr.length>0)
    : years
  const tlKey = filteredYears.map(([y, arr]) => `${y}:${arr.length}`).join("|")
  // 刊头统计：篇数 / 年数 / 分类数 / 最近更新（MM-DD）
  const catCount = new Set(posts.map((p: any) => p.category).filter(Boolean)).size
  // P2-13：单篇日期非法会让 Math.max 得到 NaN，导致整块统计退化为"—"，故逐条校验
  const latestTs = posts.reduce((acc: number, p: any) => {
    const ts = new Date(p.publishedAt || p.createdAt).getTime()
    return Number.isNaN(ts) ? acc : Math.max(acc, ts)
  }, 0)
  const latestMd = latestTs ? mdInSiteTz(new Date(latestTs).toISOString()) : "—"

  useEffect(() => {
    const root = tlRef.current
    if (!root) return
    setArmed(true)
    const items = root.querySelectorAll(".tl-item")
    // 节点/条目进入视口 → is-in（一次性，之后不再观察）
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-in")
          io.unobserve(en.target)
        }
      })
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 })
    items.forEach((el) => io.observe(el))

    // Motion 02：轴线随视口遍历容器的进度生长（transform-only，合成层友好）
    function onScroll() {
      const r = root!.getBoundingClientRect()
      const vh = window.innerHeight || 1
      const p = Math.min(1, Math.max(0, (vh * 0.72 - r.top) / (r.height || 1)))
      setGrow((prev) => (Math.abs(prev - p) < 0.004 ? prev : p))
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      io.disconnect()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tlKey])

  return (
    <>
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
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("sl-open-search"))}
              className="w-[34px] h-[30px] flex items-center justify-center border border-[var(--yh-border)] bg-[var(--dash-card)] text-[var(--yh-muted)] hover:text-[var(--yh-text)] hover:border-[var(--yh-muted)] transition-colors rounded-none"
              aria-label={lang === "zh" ? "全局搜索" : "Search"}
              title={lang === "zh" ? "全局搜索（/）" : "Search (/)"}
            >
              <Search className="w-3.5 h-3.5" />
            </button>
            <ThemeToggle />
            <LanguageSwitcher />
            <Link href="/" className="mono text-[12px] tracking-[0.14em] uppercase text-[var(--yh-muted)] hover:text-[var(--yh-text)] transition-colors border border-[var(--yh-border)] px-3 py-[5px] bg-[var(--dash-card)] rounded-none">{t.backToHome}</Link>
          </div>
        </div>
      </div>
      <main className="flex-1 flex flex-col">
      <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6 py-6">
        <p className="mono text-[10px] tracking-[0.24em] uppercase text-[var(--yh-accent)]">Index · {lang === "zh" ? "全部日志" : "Archive"}</p>
        <h1 className="serif text-[34px] font-semibold tracking-tight mt-2">{t.archiveTitle}</h1>
        <p className="mono text-[11px] tracking-wide text-[var(--yh-muted)] mt-2">{t.archiveDesc(posts.length, years.length)}{q && ` · ${t.filteredCount(filteredYears.reduce((a, [,arr])=>a+arr.length,0))}`}</p>

        {/* 统计条：POSTS / YEARS / CATEGORIES / LATEST */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 border border-[var(--yh-border)] bg-[var(--dash-card)]">
          <div className="px-4 py-3 border-r border-b sm:border-b-0 border-[var(--yh-border)]">
            <p className="mono text-[9px] tracking-[0.22em] uppercase text-[var(--yh-muted)]">Posts</p>
            <p className="serif text-[22px] font-semibold tracking-tight leading-tight mt-1">{posts.length}</p>
          </div>
          <div className="px-4 py-3 border-b sm:border-b-0 sm:border-r border-[var(--yh-border)]">
            <p className="mono text-[9px] tracking-[0.22em] uppercase text-[var(--yh-muted)]">Years</p>
            <p className="serif text-[22px] font-semibold tracking-tight leading-tight mt-1">{years.length}</p>
          </div>
          <div className="px-4 py-3 border-r border-[var(--yh-border)]">
            <p className="mono text-[9px] tracking-[0.22em] uppercase text-[var(--yh-muted)]">Categories</p>
            <p className="serif text-[22px] font-semibold tracking-tight leading-tight mt-1">{catCount}</p>
          </div>
          <div className="px-4 py-3">
            <p className="mono text-[9px] tracking-[0.22em] uppercase text-[var(--yh-muted)]">Latest</p>
            <p className="serif text-[22px] font-semibold tracking-tight leading-tight mt-1">{latestMd}</p>
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--yh-muted)]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={lang === "zh" ? "搜索标题或分类…" : "Search titles or categories…"}
            className="w-full pl-10 pr-4 py-3 text-base border border-[var(--yh-border)] bg-[var(--dash-card)] focus:border-[var(--yh-accent)] focus:outline-none rounded-none placeholder:text-[var(--yh-muted)]"
          />
        </div>
      </div>

      {/* 真时间线：轴线 + 年份节点 + 文章节点 */}
      <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6 pb-16 flex-1">
        <div ref={tlRef} className={`tl relative ml-2 pl-8 ${armed ? "tl-armed" : ""}`}>
          {/* 轴线：底层 rail + accent 生长层 */}
          <span aria-hidden className="absolute left-[5px] top-1 h-[calc(100%-8px)] w-px bg-[var(--yh-border)]" />
          <span aria-hidden className="absolute left-[5px] top-1 h-[calc(100%-8px)] w-px bg-[var(--yh-accent)] origin-top will-change-transform" style={{ transform: `scaleY(${grow})`, transition: "transform 120ms linear" }} />

          {filteredYears.map(([year, arr]) => (
            <section key={year} className="mb-12">
              {/* 年份节点（环）+ 大号衬线年份 */}
              <div className="tl-item relative flex items-baseline gap-3 mb-5">
                <span aria-hidden className="tl-dot absolute -left-8 top-1/2 -translate-y-1/2 w-[11px] h-[11px] rounded-full border-2 border-[var(--yh-accent)] bg-[var(--dash-card)]" />
                <h2 className="serif text-[26px] font-semibold tracking-tight leading-none">{year}</h2>
                <span className="mono text-[10px] tracking-[0.18em] uppercase text-[var(--yh-muted)]">{t.postsCount2(arr.length)}</span>
                <span aria-hidden className="flex-1 h-px bg-[var(--yh-border)] self-center" />
              </div>
              <div>
                {arr.map((p:any, i:number)=> {
                  const md = mdInSiteTz(p.publishedAt || p.createdAt)
                  const title = p.titleZh || p.title
                  return (
                    <Link key={p.id} href={`/posts/${p.id}`}
                      className="tl-item group relative flex items-center gap-4 py-[9px] pr-2 hover:bg-[var(--yh-bg)]/50"
                      style={{ transitionDelay: `${(i % 8) * 55}ms` }}
                    >
                      <span aria-hidden className="tl-dot absolute -left-8 top-1/2 -translate-y-1/2 w-[7px] h-[7px] rounded-full" />
                      <span className="mono text-[11px] text-[var(--yh-muted)] w-12 shrink-0">{md}</span>
                      <span className="text-sm truncate flex-1 group-hover:text-[var(--yh-accent)] group-hover:underline underline-offset-4">{title}</span>
                      <span className="hidden sm:block"><CategoryBadge category={p.category} /></span>
                      <span className="mono text-[10px] text-[var(--yh-muted)] hidden sm:block">{p.readTime || ""}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[var(--yh-border)] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-[var(--yh-accent)] transition-all duration-200 shrink-0" />
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
          {filteredYears.length===0 && (
            <EmptyState
              title={lang === "zh" ? "没有匹配的文章" : "No matching posts"}
              hint={lang === "zh" ? "换个关键词试试，或清除筛选查看全部" : "Try another keyword, or clear the filter"}
            />
          )}
        </div>
      </div>
      </main>
      <Footer />
    </>
  )
}
