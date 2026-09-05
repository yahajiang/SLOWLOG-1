"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Footer } from "@/components/Footer"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { useLang } from "@/lib/lang-context"
import { catLabel } from "@/components/HomeClient"

// 归档默认只展示最近 8 篇，其余折叠；搜索时自动显示全部结果
const VISIBLE = 8

export default function ArchiveClient({ posts, years }: { posts: any[]; years: [number, any[]][] }) {
  const { t, lang } = useLang()
  const [q, setQ] = useState("")
  const [expanded, setExpanded] = useState(false)
  const filteredYears = q.trim()
    ? years.map(([y, arr]) => [y, arr.filter((p:any)=> (p.titleZh||p.title).toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase()))] as [number, any[]]).filter(([,arr])=> arr.length>0)
    : years

  // 折叠：跨年份按时间倒序取前 VISIBLE 篇，年份组内相应截断
  const total = filteredYears.reduce((a, [, arr]) => a + arr.length, 0)
  const visibleYears = useMemo(() => {
    if (expanded || q.trim()) return filteredYears
    let budget = VISIBLE
    const out: [number, any[]][] = []
    for (const [y, arr] of filteredYears) {
      if (budget <= 0) break
      const take = arr.slice(0, budget)
      out.push([y, take])
      budget -= take.length
    }
    return out
  }, [filteredYears, expanded, q])
  const shownCount = visibleYears.reduce((a, [, arr]) => a + arr.length, 0)
  const hiddenCount = total - shownCount

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
            <LanguageSwitcher />
            <Link href="/" className="mono text-[12px] tracking-[0.14em] uppercase text-[var(--yh-muted)] hover:text-[var(--yh-text)] transition-colors border border-[var(--yh-border)] px-3 py-[5px] bg-white rounded-none">{t.backToHome}</Link>
          </div>
        </div>
      </div>
      <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6 py-6">
        <h1 className="serif text-[32px] font-semibold tracking-tight">{t.archiveTitle}</h1>
        <p className="mono text-[11px] tracking-wide text-[var(--yh-muted)] mt-2">{t.archiveDesc(posts.length, years.length)}{q && ` · ${t.filteredCount(filteredYears.reduce((a, [,arr])=>a+arr.length,0))}`}</p>
      </div>
      <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6 pb-16 space-y-8 flex-1">
        {visibleYears.map(([year, arr]) => (
          <div key={year} className="border border-[var(--yh-border)] bg-[var(--dash-card)] p-6 rounded-none">
            <h2 className="mono text-[13px] tracking-[0.14em] uppercase font-semibold mb-4">{year} · {t.postsCount2(arr.length)}</h2>
            <div className="space-y-2">
              {arr.map((p:any)=> {
                const d = new Date(p.publishedAt || p.createdAt)
                const md = `${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
                const title = p.titleZh || p.title
                return (
                  <Link key={p.id} href={`/posts/${p.id}`} className="flex items-center gap-4 py-2 border-b border-[var(--yh-border)]/50 last:border-0 hover:bg-[var(--yh-bg)]/50 px-2 -mx-2 group">
                    <span className="mono text-[11px] text-[var(--yh-muted)] w-12 shrink-0">{md}</span>
                    <span className="text-sm truncate flex-1 group-hover:text-[var(--yh-accent)] group-hover:underline underline-offset-4">{title}</span>
                    <span className="mono text-[10px] px-2 py-0.5 border border-[var(--yh-border)] bg-white hidden sm:block">{catLabel(p.category, t)}</span>
                    <span className="mono text-[10px] text-[var(--yh-muted)] hidden sm:block">{p.readTime || ""}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
        {filteredYears.length===0 && <p className="text-sm text-[var(--yh-muted)] text-center py-12">{t.archiveEmpty}</p>}
        {!q.trim() && hiddenCount > 0 && (
          <div className="flex justify-center">
            <button
              onClick={() => setExpanded(!expanded)}
              className="mono text-[11px] tracking-[0.14em] uppercase px-5 py-2.5 border border-[var(--yh-border)] bg-[var(--dash-card)] text-[var(--yh-muted)] hover:text-[var(--yh-text)] hover:border-[var(--yh-muted)] transition-colors rounded-none min-h-[44px]"
            >
              {expanded
                ? (lang === "zh" ? "收起 · 只看最近 8 篇" : "Collapse · latest 8")
                : (lang === "zh" ? `展开全部 · ${hiddenCount} 篇` : `Expand all · ${hiddenCount} posts`)}
            </button>
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
