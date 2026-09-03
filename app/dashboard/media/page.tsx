"use client"
import { useCallback, useEffect, useState } from "react"
import { ConfirmDialog } from "@/components/ui/Dialog"
import { useToast } from "@/components/ui/Toast"
import { MediaPageSkeleton } from "@/components/dashboard/Skeleton"

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
  const [view,setView]=useState<"grid"|"list">("grid")
  const [delId,setDelId]=useState<string|null>(null)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const load = useCallback(() => fetch("/api/media").then(r => r.json()).then(d => { setItems(d); setLoading(false) }), [])
  useEffect(() => { load() }, [load])

  const upload = useCallback(async (files: FileList | null) => {
    if (!files?.length) return
    let successCount = 0
    let failCount = 0
    for (const f of Array.from(files)) {
      const form = new FormData()
      form.append("file", f)
      setProgress({ name: f.name, loaded: 0, total: f.size })
      const { ok, body } = await uploadWithProgress("/api/media", form, (loaded, total) => {
        setProgress({ name: f.name, loaded, total })
      })
      if (ok) successCount++; else failCount++
    }
    setProgress(null)
    if (successCount) toast(`已上传 ${successCount} 张${failCount ? `, ${failCount} 失败` : ""}`, failCount ? "error" : "success")
    else if (failCount) toast("上传失败", "error")
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
    await fetch(`/api/media?id=${delId}`, { method: "DELETE" })
    toast("已删除", "success")
    setDelId(null)
    load()
  }, [delId, toast, load])

  const copy = useCallback(async (url: string) => {
    await navigator.clipboard.writeText(url)
    toast("已复制链接", "success")
  }, [toast])

  return (
    loading ? <MediaPageSkeleton /> :
    <div className="space-y-6" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--dash-text)]" style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}>媒体库</h1>
        <div className="flex items-center gap-3">
          <div className="flex border border-[var(--dash-border)] rounded-none overflow-hidden text-xs">
            <button onClick={() => setView("grid")} className={`px-3 py-1.5 ${view === "grid" ? "bg-[var(--dash-text)] text-white" : "bg-[var(--dash-card)] text-[var(--dash-muted)] hover:text-[var(--dash-text)]"}`}>网格</button>
            <button onClick={() => setView("list")} className={`px-3 py-1.5 ${view === "list" ? "bg-[var(--dash-text)] text-white" : "bg-[var(--dash-card)] text-[var(--dash-muted)] hover:text-[var(--dash-text)]"}`}>列表</button>
          </div>
          <label className="px-4 py-2 bg-[var(--dash-text)] text-white text-sm rounded-none cursor-pointer hover:opacity-90 font-medium disabled:opacity-50">
            {progress ? "上传中..." : "上传"}
            <input type="file" multiple accept="image/*" className="hidden" onChange={onUploadChange} disabled={!!progress} />
          </label>
        </div>
      </div>
      <p className="text-xs text-[var(--dash-muted)]">支持 JPEG/PNG/WebP/GIF/SVG，单张 ≤5MB，JPEG/PNG→quality:75 压缩 · 支持拖拽上传</p>
      {progress && (
        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-3 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between text-xs text-[var(--dash-text)] mb-1.5">
            <span className="truncate flex-1 mr-2">{progress.name}</span>
            <span className="tabular-nums text-[var(--dash-muted)]">{Math.round((progress.loaded / progress.total) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-[var(--dash-bg)] overflow-hidden">
            <div className="h-full bg-[var(--dash-accent)] transition-all duration-150" style={{ width: `${(progress.loaded / progress.total) * 100}%` }} />
          </div>
        </div>
      )}
      {view === "grid" ? (
        <div className="grid grid-cols-4 gap-4">
          {items.map(m => (
            <div key={m.id} className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-float)] transition-shadow">
              <div className="aspect-[4/3] bg-[var(--dash-bg)] flex items-center justify-center overflow-hidden">
                {m.mimeType?.includes("svg") || m.mimeType?.includes("gif")
                  ? <img src={m.url} alt={m.alt || m.filename} loading="lazy" decoding="async" className="max-h-full" />
                  : <img src={m.url} alt={m.alt || m.filename} loading="lazy" decoding="async" className="w-full h-full object-cover" />}
              </div>
              <div className="p-3">
                <p className="text-xs font-medium truncate text-[var(--dash-text)]">{m.filename}</p>
                <p className="text-[11px] text-[var(--dash-muted)]">{(m.size / 1024).toFixed(1)}KB · {m.width || "-"}×{m.height || "-"}</p>
                <div className="flex gap-1 mt-2">
                  <button onClick={() => copy(m.url)} className="flex-1 text-xs py-1 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] hover:bg-[var(--dash-bg)]">复制</button>
                  <button onClick={() => del(m.id)} className="flex-1 text-xs py-1 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] hover:bg-red-50 hover:text-red-600 hover:border-red-200">删除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none divide-y divide-[var(--dash-border)] shadow-[var(--shadow-card)]">
          {items.map(m => (
            <div key={m.id} className="flex items-center gap-4 p-3 hover:bg-[var(--dash-bg)]">
              <img src={m.url} alt="" loading="lazy" decoding="async" className="w-12 h-12 object-cover rounded-none border border-[var(--dash-border)]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate text-[var(--dash-text)]">{m.filename}</p>
                <p className="text-xs text-[var(--dash-muted)]">{m.mimeType} · {(m.size / 1024).toFixed(1)}KB</p>
              </div>
              <button onClick={() => copy(m.url)} className="text-xs px-3 py-1 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] hover:bg-[var(--dash-bg)]">复制</button>
              <button onClick={() => del(m.id)} className="text-xs px-3 py-1 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] hover:bg-red-50 hover:text-red-600">删除</button>
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && <p className="text-center text-sm text-[var(--dash-muted)] py-12">暂无图片，拖拽或粘贴上传</p>}
      <ConfirmDialog open={!!delId} onOpenChange={(v) => !v && setDelId(null)} title="删除图片？" description="将同时从 Vercel Blob 删除，不可恢复。" confirmText="删除" variant="danger" onConfirm={confirmDel} />
    </div>
  )
}
