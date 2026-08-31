"use client"
import { useEffect, useState } from "react"
import { ConfirmDialog } from "@/components/ui/Dialog"
import { useToast } from "@/components/ui/Toast"

export default function MediaPage(){
  const [items,setItems]=useState<any[]>([])
  const [view,setView]=useState<"grid"|"list">("grid")
  const [delId,setDelId]=useState<string|null>(null)
  const { toast } = useToast()
  const load=()=>fetch("/api/media").then(r=>r.json()).then(setItems)
  useEffect(()=>{load()},[])
  const upload=async(e: React.ChangeEvent<HTMLInputElement>)=>{
    const files=e.target.files
    if(!files?.length) return
    const form=new FormData()
    for(const f of Array.from(files)) form.append("file",f)
    const r=await fetch("/api/media",{method:"POST",body:form})
    if(!r.ok){ const j=await r.json(); toast(j.error||"上传失败","error")} else toast("上传成功","success")
    load()
    e.target.value=""
  }
  const del=(id:string)=> setDelId(id)
  const confirmDel=async()=>{
    if(!delId) return
    await fetch(`/api/media?id=${delId}`,{method:"DELETE"})
    toast("已删除","success")
    setDelId(null)
    load()
  }
  const copy=async(url:string)=>{ await navigator.clipboard.writeText(url); toast("已复制链接","success") }
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if(!files.length) return
    const form=new FormData()
    for(const f of Array.from(files)) if(f.type.startsWith("image/")) form.append("file",f)
    const r=await fetch("/api/media",{method:"POST",body:form})
    if(!r.ok) toast("上传失败","error"); else toast("上传成功","success")
    load()
  }
  return (
    <div className="space-y-6" onDragOver={(e)=>e.preventDefault()} onDrop={onDrop}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--dash-text)]" style={{ fontFamily: "MiSans, sans-serif" }}>媒体库</h1>
        <div className="flex items-center gap-3">
          <div className="flex border border-[var(--dash-border)] rounded-[var(--radius-sm)] overflow-hidden text-xs">
            <button onClick={()=>setView("grid")} className={`px-3 py-1.5 ${view==="grid"?"bg-[var(--dash-text)] text-white":"bg-[var(--dash-card)] text-[var(--dash-muted)] hover:text-[var(--dash-text)]"}`}>网格</button>
            <button onClick={()=>setView("list")} className={`px-3 py-1.5 ${view==="list"?"bg-[var(--dash-text)] text-white":"bg-[var(--dash-card)] text-[var(--dash-muted)] hover:text-[var(--dash-text)]"}`}>列表</button>
          </div>
          <label className="px-4 py-2 bg-[var(--dash-text)] text-white text-sm rounded-[var(--radius-sm)] cursor-pointer hover:opacity-90 font-medium">上传<input type="file" multiple accept="image/*" className="hidden" onChange={upload} /></label>
        </div>
      </div>
      <p className="text-xs text-[var(--dash-muted)]">支持 JPEG/PNG/WebP/GIF/SVG，单张 ≤5MB，JPEG/PNG→quality:75 压缩 · 支持拖拽上传</p>
      {view==="grid" ? (
        <div className="grid grid-cols-4 gap-4">
          {items.map(m=>(
            <div key={m.id} className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-float)] transition-shadow">
              <div className="aspect-[4/3] bg-zinc-50 flex items-center justify-center overflow-hidden">
                {m.mimeType?.includes("svg") || m.mimeType?.includes("gif") ? <img src={m.url} alt={m.alt||m.filename} className="max-h-full" /> : <img src={m.url} alt={m.alt||m.filename} className="w-full h-full object-cover" />}
              </div>
              <div className="p-3">
                <p className="text-xs font-medium truncate text-[var(--dash-text)]">{m.filename}</p>
                <p className="text-[11px] text-[var(--dash-muted)]">{(m.size/1024).toFixed(1)}KB · {m.width||"-"}×{m.height||"-"}</p>
                <div className="flex gap-1 mt-2">
                  <button onClick={()=>copy(m.url)} className="flex-1 text-xs py-1 border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-white hover:bg-zinc-50">复制</button>
                  <button onClick={()=>del(m.id)} className="flex-1 text-xs py-1 border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200">删除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-[var(--radius-md)] divide-y divide-[var(--dash-border)] shadow-[var(--shadow-card)]">
          {items.map(m=>(
            <div key={m.id} className="flex items-center gap-4 p-3 hover:bg-zinc-50">
              <img src={m.url} alt="" className="w-12 h-12 object-cover rounded-[var(--radius-sm)] border border-[var(--dash-border)]" />
              <div className="flex-1 min-w-0"><p className="text-sm truncate text-[var(--dash-text)]">{m.filename}</p><p className="text-xs text-[var(--dash-muted)]">{m.mimeType} · {(m.size/1024).toFixed(1)}KB</p></div>
              <button onClick={()=>copy(m.url)} className="text-xs px-3 py-1 border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-white hover:bg-zinc-50">复制</button>
              <button onClick={()=>del(m.id)} className="text-xs px-3 py-1 border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-white hover:bg-red-50 hover:text-red-600">删除</button>
            </div>
          ))}
        </div>
      )}
      {items.length===0 && <p className="text-center text-sm text-[var(--dash-muted)] py-12">暂无图片，拖拽或粘贴上传</p>}
      <ConfirmDialog open={!!delId} onOpenChange={(v)=>!v&&setDelId(null)} title="删除图片？" description="将同时从 Vercel Blob 删除，不可恢复。" confirmText="删除" variant="danger" onConfirm={confirmDel} />
    </div>
  )
}
