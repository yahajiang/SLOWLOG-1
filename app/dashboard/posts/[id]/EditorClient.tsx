"use client"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { PostRenderer } from "@/components/editor/PostRenderer"
import { ConfigPanel } from "@/components/editor/ConfigPanel"
import type { PageConfig } from "@/lib/page-config"
import { parsePageConfig } from "@/lib/page-config"
import Link from "next/link"
import { Breadcrumb } from "@/components/Breadcrumb"
import { ConfirmDialog } from "@/components/ui/Dialog"
import { CalendarClock, Settings, RotateCcw } from "lucide-react"
import { useLang } from "@/lib/lang-context"
import { getVersions, snapVersion, forceSnap, type PostVersion } from "@/lib/post-versions"
import { useToast } from "@/components/ui/Toast"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { FormField } from "@/components/ui/FormField"
import { Toggle } from "@/components/ui/Toggle"
import { Badge } from "@/components/ui/Badge"
import { dict } from "@/lib/i18n"

// 动态导入重型编辑器组件，减少初始 bundle 体积
const TiptapEditor = dynamic(() => import("@/components/editor/TiptapEditor").then(m => ({ default: m.TiptapEditor })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[var(--dash-border)] border-t-[var(--dash-text)] rounded-none animate-spin" />
        <p className="text-sm text-[var(--dash-muted)]">加载编辑器...</p>
      </div>
    </div>
  )
})

const t = dict.zh

// 预览面板独立组件，只在内容变化时重渲染
function PreviewPanel({ content, post, pageConfig, categories }: { content: any; post: any; pageConfig: PageConfig; categories: any[] }) {
  return (
    <div className="py-6" style={{ color: pageConfig.theme === "dark" ? "#E5E5E7" : undefined, backgroundColor: pageConfig.theme === "dark" ? "#1C1C1E" : undefined }}>
      <div className="mx-auto max-w-3xl px-6">
        <Breadcrumb items={[{ label: categories.find((c: any) => c.id === post.categoryId)?.nameZh || "慢日志" }, { label: (post.titleZh || post.title) || "未命名" }]} />
        <div className="flex items-center gap-3 mb-4 mt-3">
          <span className="inline-block px-2.5 py-0.5 text-[10px] font-semibold tracking-widest uppercase rounded-none border" style={{ backgroundColor: pageConfig.primaryColor || undefined, borderColor: pageConfig.primaryColor || undefined, color: "#fff" }}>{categories.find((c: any) => c.id === post.categoryId)?.nameZh || categories.find((c: any) => c.id === post.categoryId)?.name || "未分类"}</span>
          <span className="text-zinc-200">/</span>
          <span className="text-[11px] text-[var(--yh-muted)]">{post.readTime || "5 min"}</span>
        </div>
        <h1 className={`text-3xl font-semibold leading-[1.2] tracking-tight mb-4 ${pageConfig.fontFamily === "serif" ? "font-serif" : ""}`} style={{ color: pageConfig.primaryColor && pageConfig.theme !== "dark" ? pageConfig.primaryColor : undefined }}>{(post.titleZh || post.title) || "未命名"}</h1>
        <p className="text-[15px] leading-relaxed text-[var(--yh-muted)] mb-6">{(post.excerptZh || post.excerpt) || "摘要"}</p>
        <div className="flex items-center gap-3 pb-6 border-b border-[var(--yh-border)]">
          <div className="w-10 h-10 rounded-none bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-medium">{post.authorInitial || "Y"}</div>
          <div>
            <p className="text-sm font-semibold text-zinc-800">{post.author || "Yahajiang"}</p>
            <p className="text-xs text-[var(--yh-muted)]">{new Date().toLocaleDateString()} · {categories.find((c: any) => c.id === post.categoryId)?.name || "Design"}</p>
          </div>
        </div>
      </div>
      <div className="pb-8">
        <div className="mx-auto max-w-3xl px-6">
          <PostRenderer content={content} pageConfig={pageConfig} />
        </div>
      </div>
    </div>
  )
}

export default function EditorClient({ initialPost, categories, isNew }: { initialPost: any; categories: any[]; isNew: boolean }) {
  const router = useRouter()
  const { t, lang } = useLang()
  const [post, setPost] = useState(initialPost)
  const postRef = useRef(post)
  postRef.current = post
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  // 定时发布（v0.3 P1-8）：published + 未来 publishedAt，到期惰性放出（无需 cron）
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleAt, setScheduleAt] = useState("")
  const scheduledFuture = post.status === "published" && post.publishedAt && new Date(post.publishedAt) > new Date()
  // 版本历史（v0.3 P2）：localStorage 快照，最近 10 版
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [versions, setVersions] = useState<PostVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<PostVersion | null>(null)
  const openVersions = () => {
    setVersions(getVersions(post.id))
    setSelectedVersion(null)
    setVersionsOpen(true)
  }
  const rollbackTo = (v: PostVersion) => {
    // 回滚前先 forceSnap 当前内容（保住被回滚掉的版本）
    forceSnap(post.id, post.content)
    setPost((prev: any) => ({ ...prev, content: v.content }))
    toast(t.editorRollbackDone, "success")
    setVersionsOpen(false)
    setSelectedVersion(null)
  }
  const [wordCount, setWordCount] = useState(0)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [tagsError, setTagsError] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [split, setSplit] = useState(0.5)
  const [dragging, setDragging] = useState(false)
  const splitRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const pageConfig: PageConfig = useMemo(() => parsePageConfig(post.pageConfig), [post.pageConfig])

  // 防抖字数统计 - 延迟 800ms
  useEffect(() => {
    const timer = setTimeout(() => {
      const text = JSON.stringify(post.content || "")
      const cnt = text.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "").length
      setWordCount(cnt)
    }, 800)
    return () => clearTimeout(timer)
  }, [post.content])

  useEffect(() => {
    const saved = localStorage.getItem("editor-split")
    if (saved) {
      const v = parseFloat(saved)
      if (!isNaN(v)) setSplit(Math.min(0.75, Math.max(0.25, v)))
    }
  }, [])

  useEffect(() => {
    if (!dragging) return
    document.body.style.userSelect = "none"
    return () => { document.body.style.userSelect = "" }
  }, [dragging])

  // 防抖自动保存 - 用户停止输入 3 秒后保存（不改 status）
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (isNew) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      // 版本快照（≥5 分钟节流在 snapVersion 内部）
      snapVersion(post.id, post.content)
      handleAutoSave()
    }, 3000)
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current) }
  }, [post])

  // 自动保存：只保存内容字段，不修改 status（避免覆盖发布状态）
  const handleAutoSave = useCallback(async () => {
    const current = postRef.current
    if (isNew) return
    const tagsArr: string[] = typeof current.tags === "string" ? (current.tags as string).split(",").map((s: string) => s.trim()).filter(Boolean) : (Array.isArray(current.tags) ? current.tags.map((t: string) => String(t).trim()).filter(Boolean) : [])
    const payload: any = {
      title: current.title, titleZh: current.titleZh,
      slug: current.slug || current.title?.toLowerCase().replace(/[^\w]+/g, "-"),
      excerpt: current.excerpt, excerptZh: current.excerptZh,
      content: current.content, categoryId: current.categoryId,
      tags: tagsArr, pageConfig,
      readTime: current.readTime, author: current.author, authorInitial: current.authorInitial,
      featured: current.featured,
    }
    try {
      const res = await fetch(`/api/posts/${current.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) setLastSaved(new Date())
    } catch (e) { console.error("自动保存失败:", e) }
  }, [isNew, pageConfig])

  const slugifyTitle = (title: string) =>
    title.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "")

  const handleTitleChange = useCallback((v: string) => {
    setPost((prev: any) => {
      const next: any = { ...prev, title: v, titleZh: v }
      if (!prev.slug) {
        const s = slugifyTitle(v)
        if (s) next.slug = s
      }
      return next
    })
  }, [])

  const handleSave = useCallback(async (status: string, silent = false) => {
    const current = postRef.current
    if (!silent) { setErrorMsg(null); setTagsError(null); setCategoryError(null) }

    // 仅发布/下架：只更新 status，不重发全部字段（避免校验拦截）
    if (status === "published" || status === "draft") {
      if (!silent) setSaving(true)
      try {
        const res = await fetch(`/api/posts/${current.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        })
        if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || t.toastPublishFail) }
        // 更新本地状态，badge 立即切换
        setPost((prev: any) => ({ ...prev, status }))
        setLastSaved(new Date())
        if (!silent) toast(status === "published" ? t.toastPublished : t.toastUnpublished, "success")
      } catch (e: any) {
        if (!silent) { setErrorMsg(e.message || t.toastPublishFail); toast(e.message || t.toastPublishFail, "error") }
      } finally { if (!silent) setSaving(false) }
      return
    }

    // 完整保存：发送全部字段
    const tagsArr: string[] = typeof current.tags === "string" ? (current.tags as string).split(",").map((s: string) => s.trim()).filter(Boolean) : (Array.isArray(current.tags) ? current.tags.map((t: string) => String(t).trim()).filter(Boolean) : [])
    if (!silent && tagsArr.length === 0) { setTagsError("请至少填写一个标签（逗号分隔）"); return }
    if (!silent && !current.categoryId) { setCategoryError("请选择分类"); return }
    if (!silent) setSaving(true)
    const payload = {
      title: current.title, titleZh: current.titleZh, slug: current.slug || current.title?.toLowerCase().replace(/[^\w]+/g, "-"),
      excerpt: current.excerpt, excerptZh: current.excerptZh, content: current.content, status, categoryId: current.categoryId,
      tags: tagsArr, pageConfig, seoTitle: current.seoTitle, seoDescription: current.seoDescription, seoKeywords: current.seoKeywords,
      canonicalUrl: current.canonicalUrl, ogImage: current.ogImage, noIndex: current.noIndex, featured: current.featured,
      readTime: current.readTime, author: current.author, authorInitial: current.authorInitial,
    }
    try {
      let res: Response
      if (isNew) { res = await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (res.ok) { const d = await res.json(); router.replace(`/dashboard/posts/${d.id}`) } }
      else { res = await fetch(`/api/posts/${current.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }) }
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || "save failed") }
      setLastSaved(new Date()); if (!silent) toast("已保存", "success")
    } catch (e: any) { if (!silent) { setErrorMsg(e.message || (lang === "zh" ? "保存失败" : "Save failed")); toast(e.message || (lang === "zh" ? "保存失败" : "Save failed"), "error") } }
    finally { if (!silent) setSaving(false) }
  }, [isNew, pageConfig, router, toast])

  const confirmDelete = useCallback(async () => {
    await fetch(`/api/posts/${postRef.current.id}`, { method: "DELETE" })
    toast("已删除", "success")
    router.push("/dashboard/posts")
  }, [router, toast])

  const onDividerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }, [])

  const onDividerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !splitRef.current) return
    const rect = splitRef.current.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    setSplit(Math.min(0.75, Math.max(0.25, ratio)))
  }, [dragging])

  const onDividerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
    setSplit((prev) => { localStorage.setItem("editor-split", String(prev)); return prev })
  }, [])

  return (
    <div className="flex flex-col h-screen -m-8 pt-2">
      {/* ===== Top bar ===== */}
      <div className="h-14 border-b border-[var(--dash-border)] bg-[var(--dash-card)]/90 backdrop-blur-xl px-4 flex items-center gap-3 mt-1">
        <Link href="/dashboard/posts" className="text-sm text-[var(--dash-muted)] hover:text-[var(--dash-text)] shrink-0">{t.editorBack}</Link>
        <div className="w-px h-4 bg-[var(--dash-border)]" />
        <Input value={post.title || ""} onChange={(e) => handleTitleChange(e.target.value)} placeholder="输入标题..." className="flex-1 max-w-[644px] min-w-[320px] text-sm font-semibold" style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }} />
        <Badge tone={scheduledFuture ? "sky" : post.status === "published" ? "emerald" : "amber"}>
          {scheduledFuture ? `${t.dashScheduledPrefix} ${new Date(post.publishedAt).toLocaleString(lang === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}` : post.status === "published" ? t.editorPublished : t.editorDraftBadge}
        </Badge>
        <Toggle checked={!!post.featured} onChange={(e) => setPost({ ...post, featured: e.target.checked })} label="推荐" className="shrink-0" />
        <div className="flex-1" />
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => handleSave("draft")} disabled={saving}>{saving ? t.editorSaving : t.editorSaveDraft}</Button>
          <Button variant="primary" onClick={() => handleSave("published")}>{t.editorPublish}</Button>
          <button
            onClick={openVersions}
            className="h-8 px-2.5 border border-[var(--dash-border)] rounded-none flex items-center justify-center hover:bg-[var(--dash-bg)] bg-[var(--dash-card)] text-xs text-[var(--dash-text)] hover:text-[var(--dash-accent)] transition-colors"
            aria-label={t.editorVersions}
            title={t.editorVersions}
          ><RotateCcw className="w-3.5 h-3.5" /></button>
          <button
            onClick={() => setScheduleOpen((v) => !v)}
            className="h-8 px-2.5 border border-[var(--dash-border)] rounded-none flex items-center justify-center hover:bg-[var(--dash-bg)] bg-[var(--dash-card)] text-xs text-[var(--dash-text)] hover:text-[var(--dash-accent)] transition-colors"
            aria-label={t.editorScheduleTitle}
            title={t.editorScheduleTitle}
          ><CalendarClock className="w-3.5 h-3.5" /></button>
          <button onClick={() => setShowConfig(!showConfig)} className="w-8 h-8 border border-[var(--dash-border)] rounded-none flex items-center justify-center hover:bg-[var(--dash-bg)] bg-[var(--dash-card)]" aria-label={t.editorSettings}><Settings className="w-3.5 h-3.5" /></button>
          {!isNew && <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>{t.editorDeleteBtn}</Button>}
        </div>
      </div>
      {/* 版本历史面板（v0.3 P2）：localStorage 快照，最近 10 版，可预览回滚 */}
      {versionsOpen && (
        <div className="fixed top-14 right-0 bottom-0 w-[320px] z-30 border-l border-[var(--dash-border)] bg-[var(--dash-card)] flex flex-col">
          <div className="h-12 px-4 flex items-center justify-between border-b border-[var(--dash-border)] shrink-0">
            <span className="text-sm font-medium text-[var(--dash-text)]">{t.editorVersions}</span>
            <button onClick={() => setVersionsOpen(false)} className="text-xs text-[var(--dash-muted)] hover:text-[var(--dash-text)]">关闭</button>
          </div>
          {versions.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--dash-muted)]">
              {lang === "zh" ? <>暂无历史版本。<br />编辑停止 3 秒后自动保存，<br />每 5 分钟记一版（保留最近 10 版）。</> : <>No versions yet.<br />Autosaves 3s after you stop typing; one snapshot every 5 min (last 10 kept).</>}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {versions.map((v, i) => {
                const selected = selectedVersion?.at === v.at
                return (
                  <div key={v.at} className={`px-4 py-3 border-b border-[var(--dash-border)] cursor-pointer transition-colors ${selected ? "bg-[var(--dash-bg)]" : "hover:bg-[var(--dash-bg)]/60"}`} onClick={() => setSelectedVersion(v)}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--dash-text)]">{new Date(v.at).toLocaleString("zh-CN")}</span>
                      <span className="text-[10px] text-[var(--dash-muted)]">{v.words} 字</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[10px] text-[var(--dash-muted)]">{i === 0 ? (lang === "zh" ? "最新一版" : "Latest") : lang === "zh" ? `约 ${Math.max(1, Math.round((versions[i - 1].at - v.at) / 60000))} 分钟前保存` : `Saved ~${Math.max(1, Math.round((versions[i - 1].at - v.at) / 60000))} min ago`}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); rollbackTo(v) }}
                        className="text-[10px] px-2 py-1 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] text-[var(--dash-muted)] hover:text-[var(--dash-text)] transition-colors"
                      >{lang === "zh" ? "回滚到此版" : "Roll back"}
                      </button>
                    </div>
                  </div>
                )
              })}
              <div className="px-4 py-3 text-[10px] text-[var(--dash-muted)]">{lang === "zh" ? "回滚会先保存当前内容为一版，不会丢失。" : "Current content is snapshotted before rollback — nothing is lost."}</div>
            </div>
          )}
        </div>
      )}
      {/* 定时发布面板（v0.3 P1-8）：published + 未来 publishedAt，到期惰性放出（无需 cron） */}
      {scheduleOpen && (
        <div className="border-b border-[var(--dash-border)] bg-[var(--dash-bg)] px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="text-xs text-[var(--dash-muted)]">{lang === "zh" ? "定时发布：到达设定时间后自动对读者可见（无需保持页面打开）" : "Schedule: the post becomes visible to readers at the set time (no need to keep this page open)"}</span>
          <input
            type="datetime-local"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
            className="h-8 px-2 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] text-xs text-[var(--dash-text)] focus:outline-none focus:border-[var(--dash-accent)]"
          />
          <Button
            size="sm"
            disabled={!scheduleAt || saving}
            onClick={async () => {
              setSaving(true)
              setErrorMsg("")
              try {
                const res = await fetch(`/api/posts/${post.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "published", publishedAt: new Date(scheduleAt).toISOString() }) })
                if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || t.toastScheduleFail) }
                setPost((prev: any) => ({ ...prev, status: "published", publishedAt: new Date(scheduleAt).toISOString() }))
                toast(`${t.editorScheduledDone} · ${new Date(scheduleAt).toLocaleString(lang === "zh" ? "zh-CN" : "en-US")}`, "success")
                setScheduleOpen(false)
              } catch (e: any) { setErrorMsg(e.message || t.toastScheduleFail); toast(e.message || t.toastScheduleFail, "error") }
              finally { setSaving(false) }
            }}
          >
            {saving ? t.editorProcessing : t.editorConfirmSchedule}
          </Button>
          <button onClick={() => setScheduleOpen(false)} className="text-xs text-[var(--dash-muted)] hover:text-[var(--dash-text)] transition-colors">{t.editorCancel}</button>
        </div>
      )}
      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title={lang === "zh" ? "确定删除？" : "Delete this post?"} description={lang === "zh" ? `将物理删除 "${post.title || post.slug || post.id}"，不可恢复。` : `This will permanently delete "${post.title || post.slug || post.id}". This cannot be undone.`} confirmText={t.editorDeleteBtn} variant="danger" onConfirm={confirmDelete} />

      {/* ===== 文章信息 ===== */}
      <div className="border-b border-[var(--dash-border)] bg-[var(--dash-card)] px-5 py-2">
        <div className="flex flex-wrap gap-2 items-end">
          <FormField label={t.formSlug} className="flex-[1.2] min-w-[180px]">
            <Input value={post.slug || ""} onChange={(e) => setPost({ ...post, slug: e.target.value })} placeholder="auto" className="font-mono text-[13px] h-9" />
          </FormField>
          <FormField label={t.formCategory} required error={categoryError} className="w-[88px] shrink-0">
            <Select value={post.categoryId || ""} onChange={(e) => setPost({ ...post, categoryId: e.target.value || null })} className="h-9 text-[11px] px-1">
              <option value="">未分类</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.nameZh || c.name}</option>)}
            </Select>
          </FormField>
          <FormField label={t.formTags} error={tagsError} className="flex-1 min-w-[140px]">
            <Input value={post.tags?.join ? post.tags.join(", ") : post.tags || ""} onChange={(e) => setPost({ ...post, tags: e.target.value.split(",") })} placeholder={t.formTagsPlaceholder} className="h-9" />
          </FormField>
          <FormField label={t.formExcerpt} required className="flex-[2] min-w-[220px]">
            <Input value={post.excerpt || ""} onChange={(e) => setPost({ ...post, excerpt: e.target.value, excerptZh: e.target.value })} placeholder="一句话概括..." className="h-9" />
          </FormField>
          <FormField label={t.formReadTime} className="w-[88px] shrink-0">
            <Input value={post.readTime || ""} onChange={(e) => setPost({ ...post, readTime: e.target.value })} placeholder="5 min" className="h-9 text-[11px] px-1" />
          </FormField>
          <FormField label={t.formAuthor} className="w-[99px] shrink-0">
            <Input value={post.author || ""} onChange={(e) => { const v = e.target.value; setPost({ ...post, author: v, authorInitial: v.trim() ? v.trim().charAt(0).toUpperCase() : "Y" }) }} placeholder="Yahajiang" className="h-9 text-[11px] px-1" />
          </FormField>
        </div>
        {errorMsg && <p className="text-xs text-red-500 mt-1">{errorMsg}</p>}
      </div>

      {/* ===== Main content ===== */}
      <div className="flex-1 min-h-0 flex">
        <div ref={splitRef} className="flex-1 flex min-w-0">
          {/* ---- Left: Editor ---- */}
          <div className="flex flex-col min-w-0" style={{ width: `${split * 100}%` }}>
            <div className="flex-1 min-h-0 overflow-y-auto bg-[var(--dash-bg)]">
              <div className="w-full p-4">
                <TiptapEditor content={post.content} onUpdate={(json) => setPost({ ...post, content: json })} />
              </div>
            </div>
          </div>

          {/* ---- Divider (draggable) ---- */}
          <div
            onPointerDown={onDividerDown}
            onPointerMove={onDividerMove}
            onPointerUp={onDividerUp}
            className={`w-[6px] shrink-0 flex items-center justify-center cursor-col-resize touch-none transition-colors ${dragging ? "bg-[var(--dash-accent)]/25" : "bg-[var(--dash-border)] hover:bg-[var(--dash-accent)]/15"}`}
          >
            <div className={`w-px h-8 transition-colors ${dragging ? "bg-[var(--dash-accent)]" : "bg-[var(--dash-border)]"}`} />
          </div>

          {/* ---- Right: Preview ---- */}
          <div className="flex-1 min-w-0 flex flex-col bg-[var(--dash-bg)]">
            <div className="sticky top-0 z-10 bg-[var(--dash-card)]/80 backdrop-blur border-b border-[var(--dash-border)] px-4 py-2 flex items-center justify-between text-[11px] tracking-widest uppercase text-[var(--dash-muted)]">
              <span>预览 · 与前台一致</span>
              <span className="text-xs normal-case tracking-normal">{pageConfig.layout} / {pageConfig.fontFamily} / {pageConfig.maxWidth}</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PreviewPanel content={post.content} post={post} pageConfig={pageConfig} categories={categories} />
            </div>
          </div>
        </div>
        {showConfig && <ConfigPanel value={pageConfig} onChange={(v) => setPost({ ...post, pageConfig: v })} />}
      </div>

      {/* ===== Bottom status ===== */}
      <div className="h-6 border-t border-[var(--dash-border)] bg-[var(--dash-card)] px-4 flex items-center justify-between text-[11px] text-[var(--dash-muted)]" style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}>
        <span>{t.editorWords(wordCount)} · {post.status === "published" ? t.editorPublished : t.editorDraftBadge} {lastSaved && `· ${t.editorLastSaved} ${lastSaved.toLocaleTimeString()}`}</span>
        <span>自动保存中 · 拖拽分隔条调整列宽</span>
      </div>
    </div>
  )
}