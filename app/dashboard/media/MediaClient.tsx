"use client"
import { useCallback, useEffect, useState } from "react"
import { PANEL_CLS } from "@/components/ui/Panel"
import { AdminTitle } from "@/components/ui/AdminTitle"
import { ConfirmDialog } from "@/components/ui/Dialog"
import { useToast } from "@/components/ui/Toast"
import { useLang } from "@/lib/lang-context"
import { MediaPageSkeleton } from "@/components/dashboard/Skeleton"
import { ListError } from "@/components/ui/ListError"
import { loadList } from "@/lib/admin-fetch"


interface UploadProgress { name: string; loaded: number; total: number }

function uploadWithProgress(url: string, form: FormData, onProgress: (loaded: number, total: number) => void): Promise<{ ok: boolean; status: number; body: any }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", url)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded, e.total)
    }
    xhr.onload = () => {
      let body: any = null
      try { body = JSON.parse(xhr.responseText) } catch {}
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body })
    }
    xhr.onerror = () => resolve({ ok: false, status: 0, body: null })
    xhr.send(form)
  })
}

export default function MediaPage(){
  const [items,setItems]=useState<any[]>([])
  const [loadErr,setLoadErr]=useState<string|null>(null)
  const [view,setView]=useState<"grid"|"list">("grid")
  const [page,setPage]=useState(1)
  const [total,setTotal]=useState(0)
  const totalPages=Math.max(1,Math.ceil(total/100))
  const [delId,setDelId]=useState<string|null>(null)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { t, lang } = useLang()
  const load = useCallback(async (p = page) => { const r = await loadList(`/api/media?page=${p}`); setItems(r.data); setTotal(r.total); setLoadErr(r.error); setLoading(false) }, [page])
  useEffect(() => { load() }, [load])

  const upload = useCallback(async (files: FileList | null) => {
    if (!files?.length) return
    let successCount = 0
    let failCount = 0
    for (const f of Array.from(files)) {
      const form = new FormData()
      form.append("file", f)
      setProgress({ name: f.name, loaded: 0, total: f.size })
      const { ok } = await uploadWithProgress("/api/media", form, (loaded, total) => {
        setProgress({ name: f.name, loaded, total })
      })
      if (ok) successCount++; else failCount++
    }
    setProgress(null)
    if (successCount) toast(lang === "zh" ? `已上传 ${successCount} 张${failCount ? `, ${failCount} 失败` : ""}` : `${successCount} uploaded${failCount ? `, ${failCount} failed` : ""}`, failCount ? "error" : "success")
    else if (failCount) toast(t.toastUploadFail, "error")
    load()
  }, [load, toast])

  const onUploadChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) upload(files)
    e.target.value = ""
  }, [upload])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files)
  }, [upload])

  const del = useCallback((id: string) => setDelId(id), [])
  const confirmDel = useCallback(async () => {
    if (!delId) return
    const removed = items.find((x) => x.id === delId)
    setItems((prev) => prev.filter((x) => x.id !== delId))
    setDelId(null)
    const r = await fetch(`/api/media?id=${delId}`, { method: "DELETE", cache: "no-store" })
    if (r.ok) toast(lang === "zh" ? "已删除" : "Deleted", "success")
    else {
      toast(lang === "zh" ? "删除失败" : "Delete failed", "error")
      if (removed) setItems((prev) => [...prev, removed])
    }
  }, [delId, toast, items, lang])

  const copy = useCallback(async (url: string) => {
    await navigator.clipboard.writeText(url)
    toast(lang === "zh" ? "已复制链接" : "Link copied", "success")
  }, [toast])

  return (
    loading ? <MediaPageSkeleton /> :
    <div className="space-y-6 section-in" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminTitle>{lang === "zh" ? "媒体库" : "Media"}</AdminTitle>
        <div className="flex items-center gap-3">
          <div className="flex border border-[var(--dash-border)] rounded-none overflow-hidden text-xs">
            <button onClick={() => setView("grid")} className={`px-3 py-1.5 min-h-[36px] inline-flex items-center transition-colors ${view === "grid" ? "bg-[var(--dash-text)] text-[var(--dash-bg)]" : "bg-[var(--dash-card)] text-[var(--dash-muted)] hover:text-[var(--dash-text)]"}`}>{lang === "zh" ? "网格" : "Grid"}</button>
            <button onClick={() => setView("list")} className={`px-3 py-1.5 min-h-[36px] inline-flex items-center transition-colors ${view === "list" ? "bg-[var(--dash-text)] text-[var(--dash-bg)]" : "bg-[var(--dash-card)] text-[var(--dash-muted)] hover:text-[var(--dash-text)]"}`}>{lang === "zh" ? "列表" : "List"}</button>
          </div>
          <label className="px-4 py-2 bg-[var(--dash-text)] text-[var(--dash-bg)] text-sm rounded-none cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity font-medium disabled:opacity-50 min-h-[36px] inline-flex items-center">
            {progress ? (lang === "zh" ? "上传中..." : "Uploading...") : (lang === "zh" ? "上传" : "Upload")}
            <input type="file" multiple accept="image/*" className="hidden" onChange={onUploadChange} disabled={!!progress} />
          </label>
        </div>
      </div>
      <p className="text-xs text-[var(--dash-muted)]">{lang === "zh" ? "支持 JPEG/PNG/WebP/GIF/SVG，单张 ≤5MB，JPEG/PNG→quality:75 压缩 · 支持拖拽上传" : "JPEG/PNG/WebP/GIF/SVG, max 5MB, JPEG/PNG→quality:75 · drag & drop supported"}</p>
      {progress && (
        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-3 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between text-xs text-[var(--dash-text)] mb-1.5">
            <span className="truncate flex-1 mr-2">{progress.name}</span>
            <span className="tabular-nums text-[var(--dash-muted)]">{Math.round((progress.loaded / progress.total) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-[var(--dash-bg)] overflow-hidden">
            <div className="h-full bg-[var(--dash-accent)] transition-all duration-[var(--duration-fast)]" style={{ width: `${(progress.loaded / progress.total) * 100}%` }} />
          </div>
        </div>
      )}
      {view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger">
          {items.map(m => (
            <div key={m.id} className={`${PANEL_CLS} shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-float)] hover:border-[var(--dash-muted)]/40 transition-[box-shadow,border-color] duration-[var(--duration-normal)]`}>
              <div className="aspect-[4/3] bg-[var(--dash-bg)] flex items-center justify-center overflow-hidden">
                {m.mimeType?.includes("svg") || m.mimeType?.includes("gif")
                  ? <img src={m.url} alt={m.alt || m.filename} loading="lazy" decoding="async" className="max-h-full" />
                  : <img src={m.url} alt={m.alt || m.filename} loading="lazy" decoding="async" className="w-full h-full object-cover" />}
              </div>
              <div className="p-3">
                <p className="text-xs font-medium truncate text-[var(--dash-text)]">{m.filename}</p>
                <p className="text-[11px] text-[var(--dash-muted)] tabular-nums">{(m.size / 1024).toFixed(1)}KB · {m.width || "-"}×{m.height || "-"}</p>
                <div className="flex gap-1 mt-2">
                  <button onClick={() => copy(m.url)} className="flex-1 text-xs py-1 min-h-[36px] inline-flex items-center justify-center border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] text-[var(--dash-text)] hover:bg-[var(--dash-bg)] active:opacity-80 transition-colors">{lang === "zh" ? "复制" : "Copy"}</button>
                  <button onClick={() => del(m.id)} className="flex-1 text-xs py-1 min-h-[36px] inline-flex items-center justify-center border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] text-[var(--dash-text)] hover:bg-[var(--dash-danger-soft)] hover:text-[var(--dash-danger)] hover:border-[var(--dash-danger-border)] active:opacity-80 transition-colors">{lang === "zh" ? "删除" : "Delete"}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none divide-y divide-[var(--dash-border)] shadow-[var(--shadow-card)] stagger overflow-x-auto">
          <div className="min-w-[560px] divide-y divide-[var(--dash-border)]">
          {items.map(m => (
            <div key={m.id} className="flex items-center gap-4 p-3 hover:bg-[var(--dash-bg)] active:bg-[var(--dash-bg)] transition-colors">
              <img src={m.url} alt="" loading="lazy" decoding="async" className="w-12 h-12 object-cover rounded-none border border-[var(--dash-border)]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate text-[var(--dash-text)]">{m.filename}</p>
                <p className="text-xs text-[var(--dash-muted)] tabular-nums">{m.mimeType} · {(m.size / 1024).toFixed(1)}KB</p>
              </div>
              <button onClick={() => copy(m.url)} className="text-xs px-3 py-1 min-h-[36px] inline-flex items-center border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] text-[var(--dash-text)] hover:bg-[var(--dash-bg)] active:opacity-80 transition-colors shrink-0">{lang === "zh" ? "复制" : "Copy"}</button>
              <button onClick={() => del(m.id)} className="text-xs px-3 py-1 min-h-[36px] inline-flex items-center border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] text-[var(--dash-text)] hover:bg-[var(--dash-danger-soft)] hover:text-[var(--dash-danger)] hover:border-[var(--dash-danger-border)] active:opacity-80 transition-colors shrink-0">{lang === "zh" ? "删除" : "Delete"}</button>
            </div>
          ))}
          </div>
        </div>
      )}
      {items.length === 0 && (loadErr ? <ListError onRetry={() => load()} /> : <div className="text-center py-12"><p className="text-sm font-medium text-[var(--dash-text)]">{lang === "zh" ? "暂无图片" : "No images yet"}</p><p className="text-xs text-[var(--dash-muted)] mt-1.5">{lang === "zh" ? "拖拽或粘贴上传" : "Drag, drop or paste to upload"}</p></div>)}
      {total > 100 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-[var(--dash-muted)] tabular-nums">{lang === "zh" ? `第 ${page} / ${totalPages} 页 · 共 ${total} 张` : `Page ${page} / ${totalPages} · ${total} items`}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => { setPage(p => Math.max(1, p - 1)); }} disabled={page <= 1} className="px-3 py-1.5 min-h-[36px] inline-flex items-center text-xs border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] text-[var(--dash-text)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--dash-bg)] active:opacity-80 transition-colors">{t.pagePrev}</button>
            <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); }} disabled={page >= totalPages} className="px-3 py-1.5 min-h-[36px] inline-flex items-center text-xs border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] text-[var(--dash-text)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--dash-bg)] active:opacity-80 transition-colors">{t.pageNext}</button>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!delId} onOpenChange={(v) => !v && setDelId(null)} title={lang === "zh" ? "删除图片？" : "Delete this image?"} description={lang === "zh" ? "将同时从 Vercel Blob 删除，不可恢复。" : "Also removes from Vercel Blob. This cannot be undone."} confirmText={lang === "zh" ? "删除" : "Delete"} variant="danger" onConfirm={confirmDel} />
    </div>
  )
}
