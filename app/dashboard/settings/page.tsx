"use client"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/Toast"

export default function SettingsPage(){
  const [form,setForm]=useState<any>(null)
  const [saving,setSaving]=useState(false)
  const { toast } = useToast()
  useEffect(()=>{fetch("/api/settings").then(r=>r.json()).then(setForm)},[])
  const save=async()=>{
    setSaving(true)
    const r=await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)})
    setSaving(false)
    if(r.ok) toast("已保存","success"); else toast("保存失败","error")
  }
  if(!form) return <p className="text-sm text-[var(--dash-muted)]">加载中...</p>
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--dash-text)]" style={{ fontFamily: "MiSans, sans-serif" }}>设置</h1>
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-[var(--radius-md)] p-6 space-y-5 shadow-[var(--shadow-card)]">
        <div><label className="text-xs text-[var(--dash-muted)]">站点名称</label><input value={form.siteName||""} onChange={e=>setForm({...form,siteName:e.target.value})} className="mt-1 w-full px-3 py-2 text-sm border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-zinc-50 focus:bg-white focus:border-[var(--dash-accent)] focus:outline-none" /></div>
        <div><label className="text-xs text-[var(--dash-muted)]">站点描述</label><input value={form.siteDescription||""} onChange={e=>setForm({...form,siteDescription:e.target.value})} className="mt-1 w-full px-3 py-2 text-sm border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-zinc-50 focus:bg-white focus:border-[var(--dash-accent)] focus:outline-none" /></div>
        <div><label className="text-xs text-[var(--dash-muted)]">关键词</label><input value={form.siteKeywords||""} onChange={e=>setForm({...form,siteKeywords:e.target.value})} className="mt-1 w-full px-3 py-2 text-sm border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-zinc-50 focus:bg-white focus:border-[var(--dash-accent)] focus:outline-none" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs text-[var(--dash-muted)]">Favicon URL</label><input value={form.siteIconUrl||""} onChange={e=>setForm({...form,siteIconUrl:e.target.value})} className="mt-1 w-full px-3 py-2 text-sm border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-zinc-50 focus:bg-white focus:border-[var(--dash-accent)] focus:outline-none" /></div>
          <div><label className="text-xs text-[var(--dash-muted)]">Logo URL</label><input value={form.logoUrl||""} onChange={e=>setForm({...form,logoUrl:e.target.value})} className="mt-1 w-full px-3 py-2 text-sm border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-zinc-50 focus:bg-white focus:border-[var(--dash-accent)] focus:outline-none" /></div>
        </div>
        <div><label className="text-xs text-[var(--dash-muted)]">页脚文案</label><input value={form.footerText||""} onChange={e=>setForm({...form,footerText:e.target.value})} className="mt-1 w-full px-3 py-2 text-sm border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-zinc-50 focus:bg-white focus:border-[var(--dash-accent)] focus:outline-none" /></div>
        <div><label className="text-xs text-[var(--dash-muted)]">每页文章数</label><input type="number" value={form.postsPerPage||10} onChange={e=>setForm({...form,postsPerPage:parseInt(e.target.value)||10})} className="mt-1 w-32 px-3 py-2 text-sm border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-zinc-50 focus:bg-white focus:border-[var(--dash-accent)] focus:outline-none" /></div>
        <div><label className="text-xs text-[var(--dash-muted)]">主题</label><select value={form.theme||"system"} onChange={e=>setForm({...form,theme:e.target.value})} className="mt-1 px-3 py-2 text-sm border border-[var(--dash-border)] rounded-[var(--radius-sm)] bg-white focus:border-[var(--dash-accent)] focus:outline-none"><option value="light">浅色</option><option value="dark">深色</option><option value="system">跟随系统</option></select></div>
        <button onClick={save} disabled={saving} className="px-6 py-2 bg-[var(--dash-text)] text-white text-sm rounded-[var(--radius-sm)] disabled:opacity-50 hover:opacity-90 font-medium">{saving?"保存中...":"保存"}</button>
      </div>
    </div>
  )
}
