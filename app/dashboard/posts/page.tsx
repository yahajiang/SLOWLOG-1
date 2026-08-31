"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useToast } from "@/components/ui/Toast"
import { ConfirmDialog } from "@/components/ui/Dialog"

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [cats, setCats] = useState<any[]>([])
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("all")
  const [catFilter, setCatFilter] = useState("all")
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [delId, setDelId] = useState<string | null>(null)
  const { toast } = useToast()

  const load = async () => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (status !== "all") params.set("status", status)
    const res = await fetch(`/api/posts?${params}`)
    const data = await res.json()
    setPosts(Array.isArray(data) ? data : [])
  }
  const loadCats = () => fetch("/api/categories").then(r=>r.json()).then(setCats)

  useEffect(()=>{load()},[q,status])
  useEffect(()=>{loadCats()},[])

  const filtered = posts.filter(p=>{
    if(catFilter!=="all" && p.category?.slug!==catFilter && p.category?.name!==catFilter) return false
    return true
  })
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const paged = filtered.slice((page-1)*pageSize, page*pageSize)

  const toggleSelect = (id:string)=> setSelected(s=>{const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n})
  const toggleAll = ()=> setSelected(paged.length===selected.size? new Set(): new Set(paged.map(p=>p.id)))
  const copyLink = async (id:string)=>{ const url=`${location.origin}/posts/${id}`; await navigator.clipboard.writeText(url); toast("链接已复制","success")}
  const delOne = (id:string)=> setDelId(id)
  const confirmDel = async()=>{
    if(!delId) return
    const r=await fetch(`/api/posts/${delId}`,{method:"DELETE"})
    if(r.ok) toast("已删除","success"); else toast("删除失败","error")
    setDelId(null); setSelected(s=>{const n=new Set(s); n.delete(delId); return n}); await load()
  }
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const bulkDel = async()=>{
    if(selected.size===0) return
    setBulkConfirm(true)
  }
  const confirmBulkDel = async()=>{
    for(const id of selected) await fetch(`/api/posts/${id}`,{method:"DELETE"})
    toast(`已删除 ${selected.size} 篇`,"success"); setSelected(new Set()); setBulkConfirm(false); await load()
  }
  const togglePublish = async (p:any)=>{
    const ns = p.status==="published" ? "draft" : "published"
    const r = await fetch(`/api/posts/${p.id}`,{method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({status:ns})})
    if(r.ok) toast(ns==="published"?"已发布":"已下架为草稿","success"); else toast("操作失败","error")
    await load()
  }
  const toggleFeatured = async (p:any)=>{
    const r = await fetch(`/api/posts/${p.id}`,{method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({featured:!p.featured})})
    if(r.ok) toast(p.featured?"已取消推荐":"已设为推荐","success"); else toast("操作失败","error")
    await load()
  }
  const duplicate = async (p:any)=>{
    const r=await fetch("/api/posts",{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({title:p.title+" 副本", titleZh:(p.titleZh||p.title)+" 副本", slug:p.slug+"-copy-"+Date.now(), excerpt:p.excerpt, content:p.content, status:"draft", categoryId:p.categoryId, tags:p.tags, pageConfig:p.pageConfig})})
    if(r.ok) toast("已复制为草稿","success"); else {const j=await r.json(); toast(j.error||"复制失败","error")}
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--dash-text)]" style={{ fontFamily: "MiSans, sans-serif" }}>文章</h1>
        <Link href="/dashboard/posts/new" className="px-5 py-2.5 bg-[var(--dash-text)] text-white text-sm rounded-[var(--radius-sm)] hover:opacity-90 transition-opacity font-medium">新建文章</Link>
      </div>

      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-[var(--radius-md)] p-4 space-y-3 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap gap-2 items-center">
          <input value={q} onChange={e=>{setQ(e.target.value); setPage(1)}} placeholder="搜索标题、摘要、标签..." className="flex-1 min-w-[200px] px-4 py-2 text-sm border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-zinc-50 focus:bg-white focus:border-[var(--dash-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--dash-accent)]/20 transition-colors" />
          <select value={status} onChange={e=>{setStatus(e.target.value); setPage(1)}} className="px-3 py-2 text-sm border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-white focus:border-[var(--dash-accent)] focus:outline-none">
            <option value="all">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
            <option value="archived">归档</option>
          </select>
          <select value={catFilter} onChange={e=>{setCatFilter(e.target.value); setPage(1)}} className="px-3 py-2 text-sm border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-white focus:border-[var(--dash-accent)] focus:outline-none">
            <option value="all">全部分类</option>
            {cats.map((c:any)=><option key={c.id} value={c.slug}>{c.nameZh||c.name}</option>)}
          </select>
          <span className="text-xs text-[var(--dash-muted)] ml-auto tabular-nums">{total} 篇 · 第 {page}/{totalPages} 页</span>
        </div>
        {selected.size>0 && <div className="flex items-center gap-2 text-xs"><span className="text-[var(--dash-muted)]">已选 {selected.size} 篇</span><button onClick={bulkDel} className="px-3 py-1.5 bg-red-600 text-white rounded-[var(--radius-sm)] text-xs border border-red-600 hover:bg-red-700 font-medium">批量删除</button><button onClick={()=>setSelected(new Set())} className="px-3 py-1.5 border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-white hover:bg-zinc-50 text-xs">清空</button></div>}
      </div>

      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-card)]">
        <div className="px-4 py-2 border-b border-[var(--dash-border)] flex items-center gap-3 text-xs text-[var(--dash-muted)] bg-zinc-50">
          <label className="flex items-center gap-2"><input type="checkbox" checked={paged.length>0 && selected.size===paged.length} onChange={toggleAll} className="accent-[var(--dash-accent)]" /> 全选</label>
          <span className="ml-auto">标题 / 分类 / 状态 · 操作</span>
        </div>
        <div className="divide-y divide-[var(--dash-border)]">
          {paged.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-4 hover:bg-zinc-50 group">
              <input type="checkbox" checked={selected.has(p.id)} onChange={()=>toggleSelect(p.id)} className="accent-[var(--dash-accent)]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/posts/${p.id}`} className="text-sm font-medium text-[var(--dash-text)] hover:text-[var(--dash-accent)] line-clamp-1">{p.titleZh || p.title || "未命名"}</Link>
                  {p.featured && <span className="text-[10px] px-1.5 py-0.5 bg-[var(--dash-accent-soft)] text-[var(--dash-accent)] rounded border border-[var(--dash-accent)]/20">推荐</span>}
                </div>
                <p className="text-xs text-[var(--dash-muted)] mt-1 truncate">{p.category?.nameZh || p.category?.name || "未分类"} · <span className={`px-1.5 py-0.5 rounded text-[10px] border ${p.status === "published" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : p.status === "draft" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-zinc-50 text-zinc-500 border-zinc-200"}`}>{p.status}</span> · {new Date(p.createdAt).toLocaleDateString()} · {p.tags?.slice(0,2).join(", ")}</p>
              </div>
              <div className="flex items-center gap-1 ml-2 flex-wrap justify-end">
                <button onClick={()=>toggleFeatured(p)} className={`text-xs px-2.5 py-1 border rounded-[var(--radius-sm)] font-medium ${p.featured?"bg-[var(--dash-accent)] text-white border-[var(--dash-accent)] hover:opacity-90":"bg-white border-[var(--dash-border)] hover:bg-zinc-50"}`}>{p.featured?"取消推荐":"推荐"}</button>
                <button onClick={()=>togglePublish(p)} className="text-xs px-2.5 py-1 border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-white hover:bg-zinc-50 font-medium">{p.status==="published"?"下架":"发布"}</button>
                <Link href={`/dashboard/posts/${p.id}`} className="text-xs px-2.5 py-1 border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-white hover:bg-zinc-50 font-medium">编辑</Link>
                <button onClick={()=>duplicate(p)} className="text-xs px-2.5 py-1 border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-white hover:bg-zinc-50">复制</button>
                <button onClick={()=>copyLink(p.id)} className="text-xs px-2.5 py-1 border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-white hover:bg-zinc-50">链接</button>
                <Link href={`/posts/${p.id}`} target="_blank" className="text-xs px-2.5 py-1 bg-[var(--dash-text)] text-white border border-[var(--dash-text)] rounded-[var(--radius-sm)] hover:opacity-90 font-medium">查看</Link>
                <button onClick={()=>delOne(p.id)} className="text-xs px-2.5 py-1 border border-red-200 rounded-[var(--radius-sm)] bg-white text-red-600 hover:bg-red-50 font-medium">删除</button>
              </div>
            </div>
          ))}
          {paged.length === 0 && <div className="p-12 text-center text-sm text-[var(--dash-muted)]">没有匹配的文章</div>}
        </div>
        {totalPages>1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--dash-border)] bg-zinc-50 text-xs">
            <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1 border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-white disabled:opacity-50 hover:bg-zinc-50">上一页</button>
            <span className="tabular-nums">第 {page} / {totalPages} 页 · 共 {total} 篇</span>
            <button disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="px-3 py-1 border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-white disabled:opacity-50 hover:bg-zinc-50">下一页</button>
          </div>
        )}
      </div>
      <ConfirmDialog open={!!delId} onOpenChange={(v)=>!v&&setDelId(null)} title="确定删除？" description="将物理删除，不可恢复。" confirmText="删除" variant="danger" onConfirm={confirmDel} />
      <ConfirmDialog open={bulkConfirm} onOpenChange={setBulkConfirm} title={`批量删除 ${selected.size} 篇？`} description="将物理删除选中的所有文章，不可恢复。" confirmText="删除" variant="danger" onConfirm={confirmBulkDel} />
    </div>
  )
}
