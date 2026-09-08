"use client"
import { useEffect, useState } from "react"
import { ConfirmDialog } from "@/components/ui/Dialog"
import { useToast } from "@/components/ui/Toast"
import { useLang } from "@/lib/lang-context"
import { NotesPageSkeleton } from "@/components/dashboard/Skeleton"

interface Note { id: string; content: string; contentZh: string | null; createdAt: string }

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [delId, setDelId] = useState<string | null>(null)
  const { toast } = useToast()
  const { lang } = useLang()
  const fetchNotes = () => fetch("/api/thoughts").then(r=>r.json()).then(data=> { setNotes(Array.isArray(data)? data.map((d:any)=>({ id: d.id, content: d.content || d.text || "", contentZh: d.contentZh || d.textZh || d.content || d.text || "", createdAt: d.createdAt })) : []); setLoading(false) })
  useEffect(()=>{fetchNotes()},[])
  const submit = async () => {
    if (!input.trim() || input.length>500) { toast(lang === "zh" ? "内容需 1-500 字" : "Content must be 1-500 characters","error"); return }
    setLoading(true)
    const r=await fetch("/api/thoughts", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ text: input }) })
    if(!r.ok) toast(lang === "zh" ? "发布失败" : "Publish failed","error"); else toast(lang === "zh" ? "已发布" : "Published","success")
    setInput(""); setLoading(false); fetchNotes()
  }
  const del = async (id:string)=> setDelId(id)
  const confirmDel=async()=>{
    if(!delId) return
    await fetch(`/api/thoughts/${delId}`,{method:"DELETE"})
    toast(lang === "zh" ? "已删除" : "Deleted","success")
    setDelId(null)
    fetchNotes()
  }
  if (loading) return <NotesPageSkeleton />
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--dash-text)]" style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}>{lang === "zh" ? "随想" : "Thoughts"}</h1>
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-4 flex gap-3 shadow-[var(--shadow-card)]">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder={lang === "zh" ? "写点什么... (≤500字，自动识别链接)" : "Write something... (≤500 chars, links auto-detected)"} maxLength={500} className="flex-1 px-4 py-2 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--dash-accent)]/20" />
        <button onClick={submit} disabled={loading||!input.trim()} className="px-6 py-2 bg-[var(--dash-text)] text-white text-sm rounded-none disabled:opacity-50 hover:opacity-90 font-medium">{lang === "zh" ? "发布" : "Publish"}</button>
      </div>
      <div className="space-y-3">
        {notes.map(n=>(
          <div key={n.id} className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-4 flex justify-between gap-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-float)] transition-shadow">
            <div className="flex-1">
              <p className="text-sm text-[var(--dash-text)] leading-relaxed whitespace-pre-wrap break-words">{n.contentZh || n.content || (lang === "zh" ? "（空）" : "(empty)")}</p>
              <p className="text-xs text-[var(--dash-muted)] mt-2">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
            <button onClick={()=>del(n.id)} className="text-xs text-[var(--dash-muted)] hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-none border border-transparent hover:border-red-200 shrink-0">{lang === "zh" ? "删除" : "Delete"}</button>
          </div>
        ))}
        {notes.length===0 && <p className="text-sm text-[var(--dash-muted)] text-center py-12">{lang === "zh" ? "暂无随想" : "No thoughts yet"}</p>}
      </div>
      <ConfirmDialog open={!!delId} onOpenChange={(v)=>!v&&setDelId(null)} title={lang === "zh" ? "删除随想？" : "Delete this thought?"} description={lang === "zh" ? "物理删除，不可恢复。" : "This will be permanently deleted."} confirmText={lang === "zh" ? "删除" : "Delete"} variant="danger" onConfirm={confirmDel} />
    </div>
  )
}
