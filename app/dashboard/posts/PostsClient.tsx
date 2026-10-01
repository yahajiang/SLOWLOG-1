"use client"
import { useCallback, useEffect, useState } from "react"
import { PANEL_CLS } from "@/components/ui/Panel"
import { AdminTitle } from "@/components/ui/AdminTitle"
import Link from "next/link"
import { useToast } from "@/components/ui/Toast"
import { ConfirmDialog } from "@/components/ui/Dialog"
import { DropdownSelect } from "@/components/ui/DropdownSelect"
import { useLang } from "@/lib/lang-context"
import { useSiteSettings } from "@/lib/settings-context"
import { PostsPageSkeleton } from "@/components/dashboard/Skeleton"
import { ListError } from "@/components/ui/ListError"
import { loadList } from "@/lib/admin-fetch"


// 行内小钮共用一档：桌面后台密集控件走第二档（短边 ≥36），前台与移动后台仍是 48
const actBase = "text-xs px-2.5 min-h-[36px] inline-flex items-center justify-center rounded-none"

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [cats, setCats] = useState<any[]>([])
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("all")
  const [catFilter, setCatFilter] = useState("all")
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [sort, setSort] = useState("updatedAt-desc")
  // 每页条数由「站点设置·每页文章数」下发（settings-context）；无值回退 15
  const siteSettings = useSiteSettings()
  const [pageSize, setPageSize] = useState(siteSettings.postsPerPage || 15)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [booted, setBooted] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [delId, setDelId] = useState<string | null>(null)
  const { toast } = useToast()
  const { t, lang } = useLang()

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (status !== "all") params.set("status", status)
    const r = await loadList(`/api/posts?${params}`)
    setPosts(r.data)
    setLoadErr(r.error)
    setLoading(false)
    setBooted(true)
  }, [q, status])

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => { load() }, 300)
    return () => clearTimeout(timer)
  }, [load])

  useEffect(() => {
    void loadList("/api/categories").then(r => setCats(r.data))
  }, [])

  const filtered = (() => {
    let list = posts.filter(p=>{
      if(catFilter!=="all" && p.category?.slug!==catFilter && p.category?.name!==catFilter) return false
      if(featuredOnly && !p.featured) return false
      return true
    })
    if (sort === "featured-first") {
      return [...list].sort((a,b)=>
        (b.featured?1:0)-(a.featured?1:0) ||
        (new Date(b.updatedAt||0).getTime() - new Date(a.updatedAt||0).getTime())
      )
    }
    const [key, dir] = sort.split("-")
    const mul = dir === "asc" ? 1 : -1
    list = [...list].sort((a,b)=>{
      if (key === "title") {
        return mul * String(a.titleZh||a.title||"").localeCompare(String(b.titleZh||b.title||""), "zh")
      }
      if (key === "views") return mul * ((a.viewCount||0) - (b.viewCount||0))
      if (key === "createdAt") return mul * (new Date(a.createdAt||0).getTime() - new Date(b.createdAt||0).getTime())
      if (key === "publishedAt") return mul * (new Date(a.publishedAt||0).getTime() - new Date(b.publishedAt||0).getTime())
      return mul * (new Date(a.updatedAt||0).getTime() - new Date(b.updatedAt||0).getTime())
    })
    return list
  })()
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage-1)*pageSize, safePage*pageSize)
  const allPagedSelected = paged.length > 0 && paged.every(p => selected.has(p.id))

  const toggleSelect = useCallback((id:string)=> setSelected(s=>{const n=new Set(s); if(n.has(id)) n.delete(id); else n.add(id); return n}), [])
  const toggleAll = useCallback(()=>{
    if (allPagedSelected) {
      const ids = new Set(paged.map(p=>p.id))
      setSelected(prev => {
        const n = new Set(prev)
        for (const id of ids) n.delete(id)
        return n
      })
    } else {
      setSelected(prev => {
        const n = new Set(prev)
        for (const p of paged) n.add(p.id)
        return n
      })
    }
  }, [paged, allPagedSelected])
  const copyLink = useCallback(async (id:string)=>{ const url=`${location.origin}/posts/${id}`; await navigator.clipboard.writeText(url); toast(lang === "zh" ? "链接已复制" : "Link copied","success")}, [toast])
  const delOne = useCallback((id:string)=> setDelId(id), [])
  const confirmDel = useCallback(async()=>{
    if(!delId) return
    setPosts(prev => prev.filter(x => x.id !== delId))
    setSelected(s=>{const n=new Set(s); n.delete(delId); return n})
    setDelId(null)
    const r=await fetch(`/api/posts/${delId}`,{method:"DELETE", cache:"no-store"})
    if(!r.ok) {
      toast(t.dashOpFail,"error")
      await load()
    } else toast(t.toastDeleted,"success")
  }, [delId, toast, load])
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const bulkDel = useCallback(()=>{
    if(selected.size===0) return
    setBulkConfirm(true)
  }, [selected])
  const confirmBulkDel = useCallback(async()=>{
    const ids = new Set(selected)
    setPosts(prev => prev.filter(x => !ids.has(x.id)))
    for(const id of selected) await fetch(`/api/posts/${id}`,{method:"DELETE", cache:"no-store"})
    toast(lang === "zh" ? `已删除 ${selected.size} 篇` : `${selected.size} deleted`,"success"); setSelected(new Set()); setBulkConfirm(false)
  }, [selected, toast])
  const togglePublish = useCallback(async (p:any)=>{
    const ns = p.status==="published" ? "draft" : "published"
    // 先改本地，避免随后 load 若读到旧缓存又盖回去
    setPosts(prev => prev.map(x => x.id === p.id ? { ...x, status: ns } : x))
    const r = await fetch(`/api/posts/${p.id}`,{method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({status:ns}), cache:"no-store"})
    if(r.ok) toast(ns==="published"?t.toastPublished:t.toastUnpublished,"success"); else {
      toast(t.dashOpFail,"error")
      setPosts(prev => prev.map(x => x.id === p.id ? { ...x, status: p.status } : x))
    }
  }, [toast])
  const toggleFeatured = useCallback(async (p:any)=>{
    setPosts(prev => prev.map(x => x.id === p.id ? { ...x, featured: !p.featured } : x))
    const r = await fetch(`/api/posts/${p.id}`,{method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({featured:!p.featured}), cache:"no-store"})
    if(r.ok) toast(p.featured?(lang === "zh" ? "已取消推荐" : "Unfeatured"):(lang === "zh" ? "已设为推荐" : "Featured"),"success"); else {
      toast(t.dashOpFail,"error")
      setPosts(prev => prev.map(x => x.id === p.id ? { ...x, featured: p.featured } : x))
    }
  }, [toast, lang])
  const duplicate = useCallback(async (p:any)=>{
    const r=await fetch("/api/posts",{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({title:p.title+" 副本", titleZh:(p.titleZh||p.title)+" 副本", slug:p.slug+"-copy-"+Date.now(), excerpt:p.excerpt, excerptZh:p.excerptZh, content:p.content, status:"draft", categoryId:p.categoryId, tags:p.tags, pageConfig:p.pageConfig}), cache:"no-store"})
    if(r.ok){
      toast(t.toastCopiedDraft,"success")
      const d = await r.json().catch(()=>null)
      if (d?.id) {
        setPosts(prev => [{ ...d, category: p.category, status: "draft", featured: false }, ...prev])
        setPage(1)
        return
      }
    } else {const j=await r.json().catch(()=>({})); toast(j.error||t.toastCopyFail,"error")}
    await load()
  }, [toast, load])

  if (loading && !booted) return <PostsPageSkeleton />

  const statusOptions = [
    { value: "all", label: lang === "zh" ? "全部状态" : "All statuses" },
    { value: "published", label: t.dashPublished },
    { value: "draft", label: t.dashDraft },
    { value: "archived", label: lang === "zh" ? "归档" : "Archived" },
  ]
  const catOptions = [
    { value: "all", label: lang === "zh" ? "全部分类" : "All categories" },
    ...cats.map((c: any) => ({ value: c.slug, label: c.nameZh || c.name })),
  ]
  const featuredOptions = [
    { value: "0", label: lang === "zh" ? "推荐筛选" : "Featured" },
    { value: "1", label: lang === "zh" ? "仅推荐" : "Featured only" },
  ]
  const sortOptions = [
    { value: "updatedAt-desc", label: lang === "zh" ? "最近更新 ↓" : "Updated ↓" },
    { value: "updatedAt-asc", label: lang === "zh" ? "最近更新 ↑" : "Updated ↑" },
    { value: "createdAt-desc", label: lang === "zh" ? "创建时间 ↓" : "Created ↓" },
    { value: "createdAt-asc", label: lang === "zh" ? "创建时间 ↑" : "Created ↑" },
    { value: "publishedAt-desc", label: lang === "zh" ? "发布时间 ↓" : "Published ↓" },
    { value: "title-asc", label: lang === "zh" ? "标题 A→Z" : "Title A→Z" },
    { value: "title-desc", label: lang === "zh" ? "标题 Z→A" : "Title Z→A" },
    { value: "views-desc", label: lang === "zh" ? "浏览量 ↓" : "Views ↓" },
    { value: "views-asc", label: lang === "zh" ? "浏览量 ↑" : "Views ↑" },
    { value: "featured-first", label: lang === "zh" ? "推荐优先" : "Featured first" },
  ]
  // 选项并入站点设置的每页文章数（任意 1-100 值也能选回当前值）
  const pageSizeOptions = [...new Set([10, 15, 25, 50, 100, siteSettings.postsPerPage || 15])]
    .filter((n) => n >= 1 && n <= 100)
    .sort((a, b) => a - b)
    .map((n) => ({
      value: String(n),
      label: `${n} / ${lang === "zh" ? "页" : "page"}`,
    }))

  return (
    <div className="space-y-4 section-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminTitle>{t.dashPosts}</AdminTitle>
        <Link href="/dashboard/posts/new" className="px-5 py-2.5 bg-[var(--dash-text)] text-[var(--dash-bg)] text-sm rounded-none hover:opacity-90 active:opacity-80 transition-opacity font-medium min-h-[36px] inline-flex items-center">{t.dashNewPost}</Link>
      </div>

      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-4 space-y-3 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap gap-2 items-center">
          <input value={q} onChange={e=>{setQ(e.target.value); setPage(1)}} placeholder={lang === "zh" ? "搜索标题、摘要、标签..." : "Search title, excerpt, tags..."} className="flex-1 min-w-[200px] px-4 py-2 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--dash-accent)]/20 transition-colors" />
          <DropdownSelect
            value={status}
            onChange={(v) => { setStatus(v); setPage(1) }}
            options={statusOptions}
            ariaLabel={lang === "zh" ? "状态筛选" : "Status"}
            className="w-[140px]"
          />
          <DropdownSelect
            value={catFilter}
            onChange={(v) => { setCatFilter(v); setPage(1) }}
            options={catOptions}
            ariaLabel={lang === "zh" ? "分类筛选" : "Category"}
            className="w-[140px]"
          />
          <DropdownSelect
            value={featuredOnly ? "1" : "0"}
            onChange={(v) => { setFeaturedOnly(v === "1"); setPage(1) }}
            options={featuredOptions}
            ariaLabel={lang === "zh" ? "推荐筛选" : "Featured"}
            className="w-[130px]"
          />
          <DropdownSelect
            value={sort}
            onChange={(v) => { setSort(v); setPage(1) }}
            options={sortOptions}
            ariaLabel={lang === "zh" ? "排序" : "Sort"}
            className="w-[150px]"
          />
          <DropdownSelect
            value={String(pageSize)}
            onChange={(v) => { setPageSize(Number(v)); setPage(1) }}
            options={pageSizeOptions}
            ariaLabel={lang === "zh" ? "每页条数" : "Page size"}
            className="w-[110px]"
          />
          <span className="text-xs text-[var(--dash-muted)] ml-auto tabular-nums">{lang === "zh" ? `${total} 篇 · 第 ${safePage}/${totalPages} 页` : `${total} posts · Page ${safePage}/${totalPages}`}</span>
        </div>
          {selected.size>0 && <div className="flex items-center gap-2 text-xs"><span className="text-[var(--dash-muted)] tabular-nums">{lang === "zh" ? `已选 ${selected.size} 篇` : `${selected.size} selected`}</span><button onClick={bulkDel} className="px-3 py-1.5 min-h-[36px] inline-flex items-center bg-[var(--dash-danger)] text-[var(--dash-danger-fg)] rounded-none text-xs border border-[var(--dash-danger)] hover:bg-[var(--dash-danger-strong)] active:opacity-80 transition-colors font-medium">{lang === "zh" ? "批量删除" : "Delete selected"}</button><button onClick={()=>setSelected(new Set())} className="px-3 py-1.5 min-h-[36px] inline-flex items-center border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] text-[var(--dash-text)] hover:bg-[var(--dash-bg)] active:opacity-80 transition-colors text-xs">{lang === "zh" ? "清空" : "Clear"}</button></div>}
      </div>

      <div className={`${PANEL_CLS} shadow-[var(--shadow-card)] overflow-x-auto`}>
        <div className="min-w-[720px]">
        <div className="px-4 py-2 border-b border-[var(--dash-border)] flex items-center gap-3 text-xs text-[var(--dash-muted)] bg-[var(--dash-bg)]">
          <label className="flex items-center gap-2"><input type="checkbox" checked={allPagedSelected} onChange={toggleAll} className="accent-[var(--dash-accent)]" /> {lang === "zh" ? "全选" : "All"}</label>
          <span className="ml-auto">{lang === "zh" ? "标题 / 分类 / 状态 · 操作" : "Title / Category / Status · Actions"}</span>
        </div>
        <div className="divide-y divide-[var(--dash-border)] stagger">
          {paged.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-4 hover:bg-[var(--dash-bg)] active:bg-[var(--dash-bg)] transition-colors group">
              <input type="checkbox" checked={selected.has(p.id)} onChange={()=>toggleSelect(p.id)} className="accent-[var(--dash-accent)]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/posts/${p.id}`} className="text-sm font-medium text-[var(--dash-text)] hover:text-[var(--dash-accent)] line-clamp-1">{p.titleZh || p.title || t.dashUntitled}</Link>
                  {p.featured && <span className="text-[10px] px-1.5 py-0.5 bg-[var(--dash-accent-soft)] text-[var(--dash-accent)] rounded-none border border-[var(--dash-accent)]/20">{lang === "zh" ? "推荐" : "★"}</span>}
                </div>
                <p className="text-xs text-[var(--dash-muted)] mt-1 truncate">{p.category?.nameZh || p.category?.name || t.dashUncategorized} · <span className={`px-1.5 py-0.5 rounded-none text-[10px] border ${p.status === "published" ? (p.publishedAt && new Date(p.publishedAt) > new Date() ? "bg-[var(--dash-info-soft)] text-[var(--dash-info)] border-[var(--dash-info-border)]" : "bg-[var(--dash-ok-soft)] text-[var(--dash-ok)] border-[var(--dash-ok-border)]") : p.status === "draft" ? "bg-[var(--dash-warn-soft)] text-[var(--dash-warn)] border-[var(--dash-warn-border)]" : "bg-[var(--dash-bg)] text-[var(--dash-muted)] border-[var(--dash-border)]"}`}>{p.status === "published" && p.publishedAt && new Date(p.publishedAt) > new Date() ? `${t.dashScheduledPrefix} ${new Date(p.publishedAt).toLocaleDateString()}` : p.status}</span> · {new Date(p.createdAt).toLocaleDateString()} · {p.tags?.slice(0,2).join(", ")}</p>
              </div>
              <div className="flex items-center gap-1 ml-2 flex-wrap justify-end">
                <button onClick={()=>toggleFeatured(p)} className={`${actBase} border font-medium transition-colors ${p.featured?"bg-[var(--dash-accent)] text-[var(--dash-bg)] border-[var(--dash-accent)] hover:opacity-90 active:opacity-80":"bg-[var(--dash-card)] text-[var(--dash-text)] border-[var(--dash-border)] hover:bg-[var(--dash-bg)] active:opacity-80"}`}>{p.featured?(lang === "zh" ? "取消推荐" : "Unfeature"):(lang === "zh" ? "推荐" : "Feature")}</button>
                <button onClick={()=>togglePublish(p)} className={`${actBase} border border-[var(--dash-border)] bg-[var(--dash-card)] text-[var(--dash-text)] hover:bg-[var(--dash-bg)] active:opacity-80 transition-colors font-medium`}>{p.status==="published"?(lang === "zh" ? "下架" : "Unpublish"):(lang === "zh" ? "发布" : "Publish")}</button>
                <Link href={`/dashboard/posts/${p.id}`} className={`${actBase} border border-[var(--dash-border)] bg-[var(--dash-card)] text-[var(--dash-text)] hover:bg-[var(--dash-bg)] active:opacity-80 transition-colors font-medium`}>{lang === "zh" ? "编辑" : "Edit"}</Link>
                <button onClick={()=>duplicate(p)} className={`${actBase} border border-[var(--dash-border)] bg-[var(--dash-card)] text-[var(--dash-text)] hover:bg-[var(--dash-bg)] active:opacity-80 transition-colors`}>{lang === "zh" ? "复制" : "Duplicate"}</button>
                <button onClick={()=>copyLink(p.id)} className={`${actBase} border border-[var(--dash-border)] bg-[var(--dash-card)] text-[var(--dash-text)] hover:bg-[var(--dash-bg)] active:opacity-80 transition-colors`}>{lang === "zh" ? "链接" : "Link"}</button>
                <Link href={`/posts/${p.id}`} target="_blank" className={`${actBase} bg-[var(--dash-text)] text-[var(--dash-bg)] border border-[var(--dash-text)] hover:opacity-90 active:opacity-80 transition-opacity font-medium`}>{lang === "zh" ? "查看" : "View"}</Link>
                <button onClick={()=>delOne(p.id)} className={`${actBase} border border-[var(--dash-danger-border)] bg-[var(--dash-card)] text-[var(--dash-danger)] hover:bg-[var(--dash-danger-soft)] active:opacity-80 transition-colors font-medium`}>{t.dashDelete}</button>
              </div>
            </div>
          ))}
          {paged.length === 0 && (loadErr ? <ListError onRetry={load} /> : <div className="p-12 text-center"><p className="text-sm font-medium text-[var(--dash-text)]">{loading ? (lang === "zh" ? "加载中…" : "Loading…") : t.dashEmptyFiltered}</p>{!loading && <p className="text-xs text-[var(--dash-muted)] mt-1.5">{lang === "zh" ? "换个关键词试试，或清除筛选查看全部" : "Try another keyword, or clear filters"}</p>}</div>)}
        </div>
        {totalPages>1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--dash-border)] bg-[var(--dash-bg)] text-xs">
            <button disabled={safePage<=1} onClick={()=>setPage(safePage-1)} className="px-3 py-1 min-h-[36px] inline-flex items-center border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] text-[var(--dash-text)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--dash-bg)] active:opacity-80 transition-colors">{t.pagePrev}</button>
            <span className="tabular-nums text-[var(--dash-muted)]">{lang === "zh" ? `第 ${safePage} / ${totalPages} 页 · 共 ${total} 篇` : `Page ${safePage}/${totalPages} · ${total} posts`}</span>
            <button disabled={safePage>=totalPages} onClick={()=>setPage(safePage+1)} className="px-3 py-1 min-h-[36px] inline-flex items-center border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] text-[var(--dash-text)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--dash-bg)] active:opacity-80 transition-colors">{t.pageNext}</button>
          </div>
        )}
        </div>
      </div>
      <ConfirmDialog open={!!delId} onOpenChange={(v)=>!v&&setDelId(null)} title={lang === "zh" ? "确定删除？" : "Delete this post?"} description={lang === "zh" ? "将物理删除，不可恢复。" : "This will be permanently deleted."} confirmText={t.dashDelete} variant="danger" onConfirm={confirmDel} />
      <ConfirmDialog open={bulkConfirm} onOpenChange={setBulkConfirm} title={lang === "zh" ? `批量删除 ${selected.size} 篇？` : `Delete ${selected.size} selected?`} description={lang === "zh" ? "将物理删除选中的所有文章，不可恢复。" : "Selected posts will be permanently deleted."} confirmText={t.dashDelete} variant="danger" onConfirm={confirmBulkDel} />
    </div>
  )
}
