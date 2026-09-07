"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, Search } from "lucide-react"
import { Footer } from "@/components/Footer"
import { CategoryBadge } from "@/components/CategoryBadge"
import { EmptyState } from "@/components/EmptyState"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { useLang } from "@/lib/lang-context"
import { catLabel } from "@/components/HomeClient"

// 归档页 = 查看全部的终点：全量按年份分组显示（首页时间线卡只放最近 8 条，其余引导到这里）
export default function ArchiveClient({ posts, years }: { posts: any[]; years: [number, any[]][] }) {
  const { t, lang } = useLang()
  const [q, setQ] = useState("")
  const filteredYears = q.trim()
    ? years.map(([y, arr]) => [y, arr.filter((p:any)=> (p.titleZh||p.title).toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase()))] as [number, any[]]).filter(([,arr])=> arr.length>0)
    : years

  return (
    <>
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
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("sl-open-search"))}
              className="w-[34px] h-[30px] flex items-center justify-center border border-[var(--yh-border)] bg-[var(--dash-card)] text-[var(--yh-muted)] hover:text-[var(--yh-text)] hover:border-[var(--yh-muted)] transition-colors rounded-none"
              aria-label={lang === "zh" ? "全局搜索" : "Search"}
              title={lang === "zh" ? "全局搜索（/）" : "Search (/)"}
            >
              <Search className="w-3.5 h-3.5" />
            </button>
            <LanguageSwitcher />
            <Link href="/" className="mono text-[12px] tracking-[0.14em] uppercase text-[var(--yh-muted)] hover:text-[var(--yh-text)] transition-colors border border-[var(--yh-border)] px-3 py-[5px] bg-white rounded-none">{t.backToHome}</Link>
          </div>
        </div>
      </div>
      <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6 py-6">
        <h1 className="serif text-[32px] font-semibold tracking-tight">{t.archiveTitle}</h1>
        <p className="mono text-[11px] tracking-wide text-[var(--yh-muted)] mt-2">{t.archiveDesc(posts.length, years.length)}{q && ` · ${t.filteredCount(filteredYears.reduce((a, [,arr])=>a+arr.length,0))}`}</p>
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
      <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6 pb-16 space-y-8 flex-1">
        {filteredYears.map(([year, arr]) => (
          <div key={year} className="border border-[var(--yh-border)] bg-[var(--dash-card)] p-6 rounded-none">
            <h2 className="mono text-[13px] tracking-[0.14em] uppercase font-semibold mb-4">{year} · {t.postsCount2(arr.length)}</h2>
            <div className="space-y-2">
              {arr.map((p:any)=> {
                const d = new Date(p.publishedAt || p.createdAt)
                const md = `${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
                const title = p.titleZh || p.title
                return (
                  <Link key={p.id} href={`/posts/${p.id}`} className="group flex items-center gap-4 py-2 border-b border-[var(--yh-border)]/50 last:border-0 hover:bg-[var(--yh-bg)]/50 px-2 -mx-2">
                    <span className="mono text-[11px] text-[var(--yh-muted)] w-12 shrink-0">{md}</span>
                    <span className="text-sm truncate flex-1 group-hover:text-[var(--yh-accent)] group-hover:underline underline-offset-4">{title}</span>
                    <span className="hidden sm:block"><CategoryBadge category={p.category} /></span>
                    <span className="mono text-[10px] text-[var(--yh-muted)] hidden sm:block">{p.readTime || ""}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-[var(--yh-accent)] transition-all duration-200 shrink-0" />
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
        {filteredYears.length===0 && (
            <EmptyState
              title={lang === "zh" ? "没有匹配的文章" : "No matching posts"}
              hint={lang === "zh" ? "换个关键词试试，或清除筛选查看全部" : "Try another keyword, or clear the filter"}
            />
          )}
      </div>
      <Footer />
    </>
  )
}
