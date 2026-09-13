"use client"
import { useEffect, useState } from "react"
import { ConfirmDialog } from "@/components/ui/Dialog"
import { useToast } from "@/components/ui/Toast"
import { useLang } from "@/lib/lang-context"
import { CategoriesPageSkeleton } from "@/components/dashboard/Skeleton"

type CatDraft = { id: string; name: string; nameZh: string; slug: string; description: string }

export default function CategoriesPage(){
  const [cats,setCats]=useState<any[]>([])
  const [name,setName]=useState("")
  const [nameZh,setNameZh]=useState("")
  const [slug,setSlug]=useState("")
  const [desc,setDesc]=useState("")
  const [loading, setLoading] = useState(true)
  const [delId,setDelId]=useState<string|null>(null)
  const [editingId,setEditingId]=useState<string|null>(null)
  const [draft,setDraft]=useState<CatDraft|null>(null)
  const [saving,setSaving]=useState(false)
  const { toast } = useToast()
  const { lang } = useLang()
  const load=()=>fetch("/api/categories",{cache:"no-store"}).then(r=>r.json()).then(d=>{setCats(Array.isArray(d)?d:[]); setLoading(false)})
  useEffect(()=>{load()},[])
  const create=async()=>{
    if(!name||!slug) { toast(lang === "zh" ? "名称和Slug必填" : "Name and Slug are required","error"); return }
    const r=await fetch("/api/categories",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,nameZh,slug,description:desc}),cache:"no-store"})
    if(!r.ok){ const j=await r.json().catch(()=>({})); toast(j.error||"创建失败","error"); return }
    const created = await r.json().catch(() => null)
    toast(lang === "zh" ? "创建成功" : "Created", "success")
    setName("");setNameZh("");setSlug("");setDesc("")
    if (created?.id) {
      setCats(prev => [...prev, { ...created, _count: created._count ?? { posts: 0 } }])
    } else load()
  }
  const startEdit=(c:any)=>{ setEditingId(c.id); setDraft({ id:c.id, name:c.name||"", nameZh:c.nameZh||"", slug:c.slug||"", description:c.description||"" }) }
  const cancelEdit=()=>{ setEditingId(null); setDraft(null) }
  const saveEdit=async()=>{
    if(!draft) return
    if(!draft.name||!draft.slug){ toast(lang === "zh" ? "名称和Slug必填" : "Name and Slug are required","error"); return }
    setSaving(true)
    const prev = cats
    setCats(list => list.map(x => x.id===draft.id ? { ...x, name:draft.name, nameZh:draft.nameZh, slug:draft.slug, description:draft.description } : x))
    const r=await fetch(`/api/categories/${draft.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:draft.name,nameZh:draft.nameZh,slug:draft.slug,description:draft.description}),cache:"no-store"})
    setSaving(false)
    if(!r.ok){
      const j=await r.json().catch(()=>({}))
      toast(j.error||(lang === "zh" ? "保存失败" : "Save failed"),"error")
      setCats(prev)
      return
    }
    toast(lang === "zh" ? "已保存" : "Saved","success")
    cancelEdit()
  }
  const del=async(id:string)=> setDelId(id)
  const confirmDel=async()=>{
    if(!delId) return
    const removed = cats.find(c=>c.id===delId)
    setCats(prev=>prev.filter(c=>c.id!==delId))
    setDelId(null)
    const r=await fetch(`/api/categories/${delId}`,{method:"DELETE",cache:"no-store"})
    if(!r.ok){
      const j=await r.json().catch(()=>({}))
      toast(j.error||(lang === "zh" ? "删除失败" : "Delete failed"),"error")
      if (removed) setCats(prev=>[...prev, removed])
    } else toast(lang === "zh" ? "已删除" : "Deleted","success")
  }
  if (loading) return <CategoriesPageSkeleton />
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--dash-text)]" style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}>{lang === "zh" ? "分类" : "Categories"}</h1>
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 flex flex-wrap gap-3 items-end shadow-[var(--shadow-card)]">
        <div><label className="text-xs text-[var(--dash-muted)]">{lang === "zh" ? "名称" : "Name"}</label><input value={name} onChange={e=>setName(e.target.value)} className="block mt-1 px-3 py-2 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none" placeholder={lang === "zh" ? "Design" : "Design"} /></div>
        <div><label className="text-xs text-[var(--dash-muted)]">{lang === "zh" ? "中文" : "Chinese"}</label><input value={nameZh} onChange={e=>setNameZh(e.target.value)} className="block mt-1 px-3 py-2 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none" placeholder={lang === "zh" ? "设计" : "设计"} /></div>
        <div><label className="text-xs text-[var(--dash-muted)]">Slug</label><input value={slug} onChange={e=>setSlug(e.target.value)} className="block mt-1 px-3 py-2 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none" placeholder="design" /></div>
        <div><label className="text-xs text-[var(--dash-muted)]">{lang === "zh" ? "描述" : "Description"}</label><input value={desc} onChange={e=>setDesc(e.target.value)} className="block mt-1 px-3 py-2 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none" placeholder={lang === "zh" ? "可选" : "Optional"} /></div>
        <button onClick={create} className="px-6 py-2 bg-[var(--dash-text)] text-white text-sm rounded-none hover:opacity-90 font-medium">{lang === "zh" ? "新建" : "New"}</button>
      </div>
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none overflow-hidden divide-y divide-[var(--dash-border)] shadow-[var(--shadow-card)]">
        {cats.map(c=>(
          <div key={c.id} className="p-4 hover:bg-[var(--dash-bg)]">
            {editingId===c.id && draft ? (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div><label className="text-[11px] text-[var(--dash-muted)]">{lang === "zh" ? "名称" : "Name"}</label><input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} className="block w-full mt-0.5 px-2.5 py-1.5 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:border-[var(--dash-accent)] focus:outline-none" /></div>
                  <div><label className="text-[11px] text-[var(--dash-muted)]">{lang === "zh" ? "中文" : "Chinese"}</label><input value={draft.nameZh} onChange={e=>setDraft({...draft,nameZh:e.target.value})} className="block w-full mt-0.5 px-2.5 py-1.5 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:border-[var(--dash-accent)] focus:outline-none" /></div>
                  <div><label className="text-[11px] text-[var(--dash-muted)]">Slug</label><input value={draft.slug} onChange={e=>setDraft({...draft,slug:e.target.value})} className="block w-full mt-0.5 px-2.5 py-1.5 text-sm font-mono border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:border-[var(--dash-accent)] focus:outline-none" /></div>
                  <div><label className="text-[11px] text-[var(--dash-muted)]">{lang === "zh" ? "描述" : "Description"}</label><input value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})} className="block w-full mt-0.5 px-2.5 py-1.5 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:border-[var(--dash-accent)] focus:outline-none" /></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={saving} className="px-4 py-1.5 bg-[var(--dash-text)] text-white text-xs rounded-none disabled:opacity-50">{saving ? (lang === "zh" ? "保存中…" : "Saving…") : (lang === "zh" ? "保存" : "Save")}</button>
                  <button onClick={cancelEdit} className="px-4 py-1.5 border border-[var(--dash-border)] text-xs rounded-none bg-[var(--dash-card)]">{lang === "zh" ? "取消" : "Cancel"}</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--dash-text)]">{c.name} {c.nameZh && <span className="text-[var(--dash-muted)]">/ {c.nameZh}</span>}</p>
                  <p className="text-xs text-[var(--dash-muted)] truncate">{c.slug} · {c._count?.posts ?? 0} {lang === "zh" ? "篇" : " posts"}{c.description ? ` · ${c.description}` : ""}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={()=>startEdit(c)} className="text-xs px-3 py-1 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] hover:bg-[var(--dash-bg)]">{lang === "zh" ? "编辑" : "Edit"}</button>
                  <button onClick={()=>del(c.id)} className="text-xs px-3 py-1 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] hover:bg-red-50 hover:text-red-600 hover:border-red-200">{lang === "zh" ? "删除" : "Delete"}</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {cats.length===0 && <p className="p-12 text-center text-sm text-[var(--dash-muted)]">{lang === "zh" ? "暂无分类" : "No categories yet"}</p>}
      </div>
      <ConfirmDialog open={!!delId} onOpenChange={(v)=>!v&&setDelId(null)} title={lang === "zh" ? "删除分类？" : "Delete this category?"} description={lang === "zh" ? "若该分类下有文章将无法删除。" : "Cannot delete if this category has posts."} confirmText={lang === "zh" ? "删除" : "Delete"} variant="danger" onConfirm={confirmDel} />
    </div>
  )
}
