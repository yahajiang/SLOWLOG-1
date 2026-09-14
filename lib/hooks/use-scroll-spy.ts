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
  /**
   * TOC 左轨（蓝条）的填充比例：按「当前小节行的中心」吸附。
   * 不能直接用 progress——那会把蓝条边缘落在上一项与当前项的分界线上，
   * 小节刚激活时看起来就是「蓝条没对准高亮项」。
   */
  railProgress: number
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
  // sync 定义在 effect 内，点击逻辑在 effect 外——用 ref 搭一座桥，好在解锁时补一次同步
  const syncRef = useRef<() => void>(() => {})
  // 最近一次算出的文章进度：点击时要立刻广播，不能广播 undefined 把顶栏文案打回原型
  const apRef = useRef(0)
  // 最近一次生效的 heading 进度：去抖后的最终值必须同时喂给 state 与广播
  const progRef = useRef(0)

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

      const doc = document.documentElement
      const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight)
      const remain = maxScroll - window.scrollY
      // 文档已滚到最底（含标签/版权/相关阅读/页脚等长尾内容，无法继续滚动）
      const atDocEnd = remain <= 8

      // ── 判据线（视口相对坐标）──
      // 常规落在 offsetPx：scroll-mt-[72px] 让标题滚到该处停住，所以判定线也用 72。
      // 但文章尾部有标签 / 版权 / 相关阅读 / 页脚这些长尾内容，末尾几节的标题可能永远
      // 滚不到这条线——那样高亮要么卡在中间节（进度却已满格），要么只能在贴底瞬间跳到
      // 末节（跳节，从倒数第三直接到最后一节）。
      // 这里把「判据线永远够不着的距离」摊到最后一段滚动里逐步补上，让末尾几节按顺序
      // 被点亮：既不跳节，也不会点不亮，且与进度天然同源。
      const lastEl = els[n - 1]
      const lastTopAbs = lastEl.getBoundingClientRect().top + window.scrollY
      const lastSpan = Math.max(lastEl.offsetHeight, 160)
      const shortfall = Math.max(0, lastTopAbs + lastSpan - (maxScroll + offsetPx))
      const sweep = shortfall > 0 && remain < shortfall ? 1 - remain / shortfall : 0
      const lineY = offsetPx + 12 + sweep * shortfall   // +12 容差，避免刚好在边界时抖动
      const line = window.scrollY + lineY

      // ── 当前节判定 ──
      let curIdx = 0
      for (let i = 0; i < n; i++) {
        const rect = els[i].getBoundingClientRect()
        if (rect.top <= lineY) curIdx = i
      }
      curIdx = Math.min(curIdx, n - 1)

      const id = headings[curIdx]?.id || ""
      setActiveId((prev) => (prev === id ? prev : id))
      setActiveIdx((prev) => (prev === curIdx ? prev : curIdx))

      // ── heading 进度（0→1）──
      // 与 curIdx 用同一条判据线，保证「蓝轨 / 百分比」与「高亮落在哪一节」永远同步
      let p = 0
      if (n === 1) {
        // 只有一节时 heading 进度没有意义，退回整体滚动比例，避免全程停在 0
        p = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 1
      } else if (atDocEnd) {
        // 贴底：此时扫掠已把 curIdx 推到末节，进度补到 1 与之一致
        p = 1
      } else if (curIdx >= n - 1) {
        // 末节：判据线扫过末标题那段高度即走完
        const local = Math.min(1, Math.max(0, (line - lastTopAbs) / Math.max(1, lastSpan)))
        p = Math.max((n - 1) / n, ((n - 1) + local) / n)
      } else {
        const curTop = els[curIdx].getBoundingClientRect().top + window.scrollY
        const nextTop = els[curIdx + 1].getBoundingClientRect().top + window.scrollY
        const span = Math.max(1, nextTop - curTop)
        const local = Math.min(1, Math.max(0, (line - curTop) / span))
        p = (curIdx + local) / n
      }
      // 去抖：变化不足 0.5% 就不动。最终值要同时用于 state 与广播——
      // 早期 state 走去抖、广播发原始值，侧栏条（吃 state）与顶栏（吃广播）会差 0.004。
      const nextProgress = Math.abs(progRef.current - p) < 0.005 ? progRef.current : p
      progRef.current = nextProgress
      setProgress(nextProgress)

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
      apRef.current = ap
      setArticleProgress((prev) => (Math.abs(prev - ap) < 0.5 ? prev : Math.round(ap)))

      // 同步广播给顶栏等消费方。
      // 之前靠「TOC 渲染后再写 documentElement.dataset」传递，顶栏要等下一次滚动才能读到，
      // 结果永远慢一拍（停在上一档的值）。改为在同一个 rAF 内同步派发，去掉这个竞态。
      window.dispatchEvent(
        new CustomEvent(PROGRESS_EVENT, {
          detail: { progress: nextProgress, articleProgress: ap },
        }),
      )
    }

    function onScroll() {
      if (lockedRef.current) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(sync)
    }

    syncRef.current = sync
    sync()

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })

    // 正文由 next/dynamic 懒加载，首测可能落在内容撑开前（maxScroll≈0 → 误判贴底 100%）。
    // 高度一变就重测，与 ReadingProgress 的兜底同款。
    const ro = new ResizeObserver(() => onScroll())
    ro.observe(document.body)

    return () => {
      cancelAnimationFrame(raf)
      stopWatching()
      ro.disconnect()
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
      if (idx >= 0) {
        setActiveIdx(idx)
        // 点击即刻把进度推到该小节起点并广播。
        // 不能只依赖「解锁后的补偿同步」——解锁要等 scrollend 或 900ms 超时，
        // 这段时间进度条纹丝不动，用户看到的就是「点了目录进度条不更新」。
        const n = headings.length
        if (n > 1) {
          const p = Math.min(1, Math.max(0, idx / n))
          progRef.current = p
          setProgress(p)
          window.dispatchEvent(
            new CustomEvent(PROGRESS_EVENT, {
              detail: { progress: p, articleProgress: apRef.current },
            }),
          )
        }
      }

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
      history.pushState(null, "", `#${id}`)

      // 解锁：scrollend 优先，超时兜底
      const unlock = () => {
        lockedRef.current = false
        unlockTimer.current = null
        // 解锁后立刻补一次同步。锁住期间 sync() 是直接 return 的，而解锁靠 scrollend
        // 事件——事件之后不会再有滚动事件来唤醒 sync，于是进度会永远停在被点击前的旧值。
        syncRef.current()
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

  // ── 左轨填充比例：吸附到当前小节行的中心 ──
  // 每行占 1/n，行中心即 (idx + 0.5)/n。这样蓝条边缘永远落在高亮项那一行的中间，
  // 不会停在行与行的分界线上（那样小节刚激活时看着就是没对齐）。
  const railProgress =
    headings.length > 1 ? Math.min(1, (activeIdx + 0.5) / headings.length) : progress

  return { activeId, activeIdx, progress, railProgress, articleProgress, scrollToHeading }
}
