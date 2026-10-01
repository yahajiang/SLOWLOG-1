"use client"
import { useEffect, useState } from "react"
import { AdminTitle } from "@/components/ui/AdminTitle"
import { ConfirmDialog } from "@/components/ui/Dialog"
import { useToast } from "@/components/ui/Toast"
import { useLang } from "@/lib/lang-context"
import { NotesPageSkeleton } from "@/components/dashboard/Skeleton"
import { ListError } from "@/components/ui/ListError"
import { loadList } from "@/lib/admin-fetch"

interface Note { id: string; content: string; contentZh: string | null; createdAt: string }

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 50
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const [delId, setDelId] = useState<string | null>(null)
  const { toast } = useToast()
  const { t, lang } = useLang()
  const fetchNotes = async (p = page) => { const r = await loadList<any>(`/api/thoughts?page=${p}`); setNotes(r.data.map((d: any) => ({ id: d.id, content: d.content || d.text || "", contentZh: d.contentZh || d.textZh || d.content || d.text || "", createdAt: d.createdAt }))); setTotal(r.total); setLoadErr(r.error); setLoading(false) }
  useEffect(()=>{fetchNotes()},[page])
  const submit = async () => {
    if (!input.trim() || input.length>500) { toast(lang === "zh" ? "内容需 1-500 字" : "Content must be 1-500 characters","error"); return }
    const text = input.trim()
    setNotes(prev => [{ id: `local-${Date.now()}`, content: text, contentZh: text, createdAt: new Date().toISOString() }, ...prev])
    setInput("")
    const r=await fetch("/api/thoughts", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ text }), cache:"no-store" })
    if(!r.ok) toast(lang === "zh" ? "发布失败" : "Publish failed","error"); else toast(lang === "zh" ? "已发布" : "Published","success")
    setPage(1)
    fetchNotes(1)
  }
  const del = async (id:string)=> setDelId(id)
  const confirmDel=async()=>{
    if(!delId) return
    setNotes(prev => prev.filter(n => n.id !== delId))
    setDelId(null)
    const r = await fetch(`/api/thoughts/${delId}`,{method:"DELETE", cache:"no-store"})
    if (r.ok) toast(lang === "zh" ? "已删除" : "Deleted","success")
    else fetchNotes()
  }
  if (loading) return <NotesPageSkeleton />
  return (
    <div className="space-y-6 max-w-2xl section-in">
      <AdminTitle>{lang === "zh" ? "随想" : "Thoughts"}</AdminTitle>
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-4 flex gap-3 shadow-[var(--shadow-card)]">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder={lang === "zh" ? "写点什么... (≤500字，自动识别链接)" : "Write something... (≤500 chars, links auto-detected)"} maxLength={500} className="flex-1 px-4 py-2 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--dash-accent)]/20" />
        <button onClick={submit} disabled={loading||!input.trim()} className="px-6 py-2 min-h-[36px] inline-flex items-center bg-[var(--dash-text)] text-[var(--dash-bg)] text-sm rounded-none disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:opacity-80 transition-opacity font-medium">{lang === "zh" ? "发布" : "Publish"}</button>
      </div>
      <div className="space-y-3 stagger">
        {notes.map(n=>(
          <div key={n.id} className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-4 flex justify-between gap-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-float)] hover:border-[var(--dash-muted)]/40 transition-[box-shadow,border-color] duration-[var(--duration-normal)]">
            <div className="flex-1">
              <p className="text-sm text-[var(--dash-text)] leading-relaxed whitespace-pre-wrap break-words">{n.contentZh || n.content || (lang === "zh" ? "（空）" : "(empty)")}</p>
              <p className="text-xs text-[var(--dash-muted)] mt-2 tabular-nums">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
            <button onClick={()=>del(n.id)} className="text-xs px-2 py-1.5 rounded-none border border-transparent hover:border-[var(--dash-danger-border)] hover:text-[var(--dash-danger)] hover:bg-[var(--dash-danger-soft)] shrink-0 min-h-[36px] min-w-[36px] inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dash-danger)]">{lang === "zh" ? "删除" : "Delete"}</button>
          </div>
        ))}
        {notes.length===0 && (loadErr ? <ListError onRetry={() => fetchNotes()} /> : <div className="text-center py-12"><p className="text-sm font-medium text-[var(--dash-text)]">{t.noThoughts}</p><p className="text-xs text-[var(--dash-muted)] mt-1.5">{t.noThoughtsHint}</p></div>)}
      </div>
      {total > 50 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-[var(--dash-muted)] tabular-nums">{lang === "zh" ? `第 ${page} / ${totalPages} 页 · 共 ${total} 条` : `Page ${page} / ${totalPages} · ${total} items`}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => { setPage(p => Math.max(1, p - 1)); }} disabled={page <= 1} className="px-3 min-h-[36px] inline-flex items-center text-xs border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] text-[var(--dash-text)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--dash-bg)] active:opacity-80 transition-colors">{t.pagePrev}</button>
            <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); }} disabled={page >= totalPages} className="px-3 min-h-[36px] inline-flex items-center text-xs border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] text-[var(--dash-text)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--dash-bg)] active:opacity-80 transition-colors">{t.pageNext}</button>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!delId} onOpenChange={(v)=>!v&&setDelId(null)} title={lang === "zh" ? "删除随想？" : "Delete this thought?"} description={lang === "zh" ? "物理删除，不可恢复。" : "This will be permanently deleted."} confirmText={lang === "zh" ? "删除" : "Delete"} variant="danger" onConfirm={confirmDel} />
    </div>
  )
}
