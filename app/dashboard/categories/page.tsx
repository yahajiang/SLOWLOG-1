"use client"
import { useEffect, useState } from "react"
import { ConfirmDialog } from "@/components/ui/Dialog"
import { useToast } from "@/components/ui/Toast"
import { CategoriesPageSkeleton } from "@/components/dashboard/Skeleton"

export default function CategoriesPage(){
  const [cats,setCats]=useState<any[]>([])
  const [name,setName]=useState("")
  const [nameZh,setNameZh]=useState("")
  const [slug,setSlug]=useState("")
  const [desc,setDesc]=useState("")
  const [loading, setLoading] = useState(true)
  const [delId,setDelId]=useState<string|null>(null)
  const { toast } = useToast()
  const load=()=>fetch("/api/categories").then(r=>r.json()).then(d=>{setCats(d); setLoading(false)})
  useEffect(()=>{load()},[])
  const create=async()=>{
    if(!name||!slug) { toast("名称和Slug必填","error"); return }
    const r=await fetch("/api/categories",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,nameZh,slug,description:desc})})
    if(!r.ok){ const j=await r.json(); toast(j.error||"创建失败","error"); return }
    toast("创建成功","success")
    setName("");setNameZh("");setSlug("");setDesc("");load()
  }
  const del=async(id:string)=> setDelId(id)
  const confirmDel=async()=>{
    if(!delId) return
    const r=await fetch(`/api/categories/${delId}`,{method:"DELETE"})
    if(!r.ok){const j=await r.json(); toast(j.error||"删除失败","error")} else toast("已删除","success")
    setDelId(null)
    load()
  }
  if (loading) return <CategoriesPageSkeleton />
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--dash-text)]" style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}>分类</h1>
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 flex flex-wrap gap-3 items-end shadow-[var(--shadow-card)]">
        <div><label className="text-xs text-[var(--dash-muted)]">名称</label><input value={name} onChange={e=>setName(e.target.value)} className="block mt-1 px-3 py-2 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none" placeholder="Design" /></div>
        <div><label className="text-xs text-[var(--dash-muted)]">中文</label><input value={nameZh} onChange={e=>setNameZh(e.target.value)} className="block mt-1 px-3 py-2 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none" placeholder="设计" /></div>
        <div><label className="text-xs text-[var(--dash-muted)]">Slug</label><input value={slug} onChange={e=>setSlug(e.target.value)} className="block mt-1 px-3 py-2 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none" placeholder="design" /></div>
        <div><label className="text-xs text-[var(--dash-muted)]">描述</label><input value={desc} onChange={e=>setDesc(e.target.value)} className="block mt-1 px-3 py-2 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none" placeholder="可选" /></div>
        <button onClick={create} className="px-6 py-2 bg-[var(--dash-text)] text-white text-sm rounded-none hover:opacity-90 font-medium">新建</button>
      </div>
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none overflow-hidden divide-y divide-[var(--dash-border)] shadow-[var(--shadow-card)]">
        {cats.map(c=>(
          <div key={c.id} className="flex items-center justify-between p-4 hover:bg-[var(--dash-bg)]">
            <div>
              <p className="text-sm font-medium text-[var(--dash-text)]">{c.name} {c.nameZh && <span className="text-[var(--dash-muted)]">/ {c.nameZh}</span>}</p>
              <p className="text-xs text-[var(--dash-muted)]">{c.slug} · {c._count?.posts ?? 0} 篇</p>
            </div>
            <button onClick={()=>del(c.id)} className="text-xs px-3 py-1 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] hover:bg-red-50 hover:text-red-600 hover:border-red-200">删除</button>
          </div>
        ))}
        {cats.length===0 && <p className="p-12 text-center text-sm text-[var(--dash-muted)]">暂无分类</p>}
      </div>
      <ConfirmDialog open={!!delId} onOpenChange={(v)=>!v&&setDelId(null)} title="删除分类？" description="若该分类下有文章将无法删除。" confirmText="删除" variant="danger" onConfirm={confirmDel} />
    </div>
  )
}
