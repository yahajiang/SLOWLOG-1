"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * 进度广播事件名。由 useScrollSpy 在每次 sync 后同步派发，
 * ReadingProgress（顶栏 2px 进度条）消费——保证它与目录蓝轨同帧同值。
 */
export const PROGRESS_EVENT = "slowlog:progress"

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
    let mo: MutationObserver | null = null

    /** 每次 sync 重新查询 heading DOM，避免闭包缓存过期 */
    function queryEls(): HTMLElement[] {
      const scope = document.querySelector("article") || document.querySelector(".prose")
      return scope
        ? Array.from(scope.querySelectorAll<HTMLElement>("h2[id], h3[id]")).slice(0, headings.length)
        : []
    }

    function stopWatching() {
      if (mo) {
        mo.disconnect()
        mo = null
      }
    }

    /**
     * 正文由 next/dynamic 懒加载，首帧可能还没有 heading。
     * 若此时直接 return，之后没有任何事件会唤醒 sync —— 表现为「首屏不滚动就没有高亮」。
     * 所以挂一个观察器等 heading 出现，找到后立即断开。
     */
    function watchForHeadings() {
      if (mo) return
      mo = new MutationObserver(() => {
        if (queryEls().length > 0) {
          stopWatching()
          sync()
        }
      })
      mo.observe(document.body, { childList: true, subtree: true })
    }

    function sync() {
      if (lockedRef.current) return

      const els = queryEls()
      const n = els.length
      if (n === 0) {
        watchForHeadings()
        return
      }
      stopWatching()

      const line = window.scrollY + offsetPx

      // 文档已滚到最底（含标签/版权/相关阅读/页脚等长尾内容，无法继续滚动）
      const atDocEnd =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8

      // ── 当前节判定 ──
      // 用 heading 元素的 getBoundingClientRect().top 直接判断
      // scroll-mt-[72px] 让 heading 滚动时停在 72px 处，所以判定线也用 72
      let curIdx = 0
      for (let i = 0; i < n; i++) {
        const rect = els[i].getBoundingClientRect()
        if (rect.top <= offsetPx + 12) curIdx = i  // +12 容差，避免刚好在边界时抖动
      }

      // 文末收口：贴底即判定为最后一节。
      // 这里不能用「末标题进视口上半」之类的比例门槛——视口越高，长尾内容占比越小，
      // 末标题就越靠下（1280 宽实测 53%~65%），永远够不到门槛，于是进度已 100%、
      // 高亮却卡在中间节。贴底是「本文已读完」唯一可靠的信号，且必须与进度同源。
      if (atDocEnd) curIdx = n - 1
      curIdx = Math.min(curIdx, n - 1)

      const id = headings[curIdx]?.id || ""
      setActiveId((prev) => (prev === id ? prev : id))
      setActiveIdx((prev) => (prev === curIdx ? prev : curIdx))

      // ── heading 进度（0→1）──
      // 与 curIdx 共用 atDocEnd，保证「蓝轨/百分比满格」与「高亮落在末节」永远同步
      let p = 0
      if (n === 1) {
        p = atDocEnd ? 1 : 0
      } else if (atDocEnd) {
        p = 1
      } else if (curIdx >= n - 1) {
        // 末节：从末标题到文底插值
        const last = els[n - 1]
        const lastTop = last.getBoundingClientRect().top + window.scrollY
        const endY = lastTop + Math.max(last.offsetHeight, 120)
        const span = Math.max(1, endY - lastTop)
        const local = Math.min(1, Math.max(0, (line - lastTop) / span))
        p = Math.max((n - 1) / n, ((n - 1) + local) / n)
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
        if (atDocEnd) ap = 100
      } else {
        const docH = document.documentElement.scrollHeight - window.innerHeight
        ap = docH > 0 ? (window.scrollY / docH) * 100 : 0
      }
      setArticleProgress((prev) => (Math.abs(prev - ap) < 0.5 ? prev : Math.round(ap)))

      // 同步广播给顶栏等消费方。
      // 之前靠「TOC 渲染后再写 documentElement.dataset」传递，顶栏要等下一次滚动才能读到，
      // 结果永远慢一拍（停在上一档的值）。改为在同一个 rAF 内同步派发，去掉这个竞态。
      window.dispatchEvent(
        new CustomEvent(PROGRESS_EVENT, {
          detail: { progress: p, articleProgress: ap },
        }),
      )
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
      stopWatching()
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
