"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type ScrollSpyResult = {
  /** 当前激活的 heading id */
  activeId: string
  /** 当前激活的 heading 索引 */
  activeIdx: number
  /** 基于 heading 位置的进度 0→1（供 TOC 蓝轨） */
  progress: number
  /** 基于文章滚动的进度 0→100（供顶栏进度条） */
  articleProgress: number
  /** 平滑滚动到指定 heading */
  scrollToHeading: (id: string) => void
}

/**
 * 统一滚动侦测 hook — 桌面 TOC / 移动端 MTOC / 顶栏进度条共用。
 *
 * - heading 判定线：offsetPx（默认 96，对应 sticky header 高度）
 * - 进度：heading 区间插值（0→1）
 * - 文章进度：article 元素顶→底映射（0→100）
 * - 点击跳转：锁定 scroll-spy 直到 scrollend 或超时
 */
export function useScrollSpy(
  headings: { id: string; text: string }[],
  { offsetPx = 72 }: { offsetPx?: number } = {},
): ScrollSpyResult {
  const [activeId, setActiveId] = useState("")
  const [activeIdx, setActiveIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [articleProgress, setArticleProgress] = useState(0)

  const lockedRef = useRef(false)
  const unlockTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── 滚动侦测 ──────────────────────────────────────────────
  useEffect(() => {
    if (headings.length === 0) return

    let raf = 0

    /** 每次 sync 重新查询 heading DOM，避免闭包缓存过期 */
    function queryEls(): HTMLElement[] {
      const scope = document.querySelector("article") || document.querySelector(".prose")
      return scope
        ? Array.from(scope.querySelectorAll<HTMLElement>("h2[id], h3[id]")).slice(0, headings.length)
        : []
    }

    function sync() {
      if (lockedRef.current) return

      const els = queryEls()
      const n = els.length
      if (n === 0) return

      const line = window.scrollY + offsetPx

      // ── 当前节判定 ──
      // 用 heading 元素的 getBoundingClientRect().top 直接判断
      // scroll-mt-[72px] 让 heading 滚动时停在 72px 处，所以判定线也用 72
      let curIdx = 0
      for (let i = 0; i < n; i++) {
        const rect = els[i].getBoundingClientRect()
        if (rect.top <= offsetPx + 12) curIdx = i  // +12 容差，避免刚好在边界时抖动
      }

      // 贴底：仅末标题已进视口上半才收口
      const nearBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 48
      if (nearBottom) {
        const last = els[n - 1]
        if (last && last.getBoundingClientRect().top < window.innerHeight * 0.5) {
          curIdx = n - 1
        }
      }
      curIdx = Math.min(curIdx, n - 1)

      const id = headings[curIdx]?.id || ""
      setActiveId((prev) => (prev === id ? prev : id))
      setActiveIdx((prev) => (prev === curIdx ? prev : curIdx))

      // ── heading 进度（0→1）──
      let p = 0
      if (n === 1) {
        p = nearBottom ? 1 : 0
      } else if (nearBottom) {
        p = 1
      } else if (curIdx >= n - 1) {
        // 末节：从末标题到文底插值
        const last = els[n - 1]
        const lastTop = last.getBoundingClientRect().top + window.scrollY
        const endY = lastTop + Math.max(last.offsetHeight, 120)
        const span = Math.max(1, endY - lastTop)
        const local = Math.min(1, Math.max(0, (line - lastTop) / span))
        const remain = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight)
        p = remain <= 48 ? 1 : Math.max((n - 1) / n, ((n - 1) + local) / n)
      } else {
        const curTop = els[curIdx].getBoundingClientRect().top + window.scrollY
        const nextTop = els[curIdx + 1].getBoundingClientRect().top + window.scrollY
        const span = Math.max(1, nextTop - curTop)
        const local = Math.min(1, Math.max(0, (line - curTop) / span))
        p = (curIdx + local) / n
      }
      setProgress((prev) => (Math.abs(prev - p) < 0.005 ? prev : p))

      // ── 文章进度（0→100）──
      const article = document.querySelector("article")
      let ap = 0
      if (article) {
        const rect = article.getBoundingClientRect()
        const articleTop = window.scrollY + rect.top
        const articleBottom = articleTop + article.offsetHeight
        const start = articleTop - offsetPx
        const finish = articleBottom - window.innerHeight
        if (finish > start) {
          ap = ((window.scrollY - start) / (finish - start)) * 100
        } else {
          ap = window.scrollY + window.innerHeight >= articleBottom - 8 ? 100 : 0
        }
        ap = Math.min(100, Math.max(0, ap))
        if (nearBottom) ap = 100
      } else {
        const docH = document.documentElement.scrollHeight - window.innerHeight
        ap = docH > 0 ? (window.scrollY / docH) * 100 : 0
      }
      setArticleProgress((prev) => (Math.abs(prev - ap) < 0.5 ? prev : Math.round(ap)))
    }

    function onScroll() {
      if (lockedRef.current) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(sync)
    }

    sync()

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      if (unlockTimer.current) clearTimeout(unlockTimer.current)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [headings, offsetPx])

  // ── 点击跳转 ──────────────────────────────────────────────
  const scrollToHeading = useCallback(
    (id: string) => {
      const el = document.getElementById(id)
      if (!el) return

      // 锁定 scroll-spy
      lockedRef.current = true
      if (unlockTimer.current) clearTimeout(unlockTimer.current)

      setActiveId(id)
      const idx = headings.findIndex((h) => h.id === id)
      if (idx >= 0) setActiveIdx(idx)

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
      history.pushState(null, "", `#${id}`)

      // 解锁：scrollend 优先，超时兜底
      const unlock = () => {
        lockedRef.current = false
        unlockTimer.current = null
      }
      unlockTimer.current = setTimeout(unlock, reduce ? 80 : 900)
      if (!reduce) {
        const onEnd = () => {
          unlock()
          window.removeEventListener("scrollend", onEnd)
        }
        window.addEventListener("scrollend", onEnd, { once: true })
      }
    },
    [headings],
  )

  return { activeId, activeIdx, progress, articleProgress, scrollToHeading }
}
