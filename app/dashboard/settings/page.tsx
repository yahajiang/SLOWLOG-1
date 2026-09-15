"use client"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/Toast"
import { DropdownSelect } from "@/components/ui/DropdownSelect"
import { useLang } from "@/lib/lang-context"
import { SettingsPageSkeleton } from "@/components/dashboard/Skeleton"
import { AccountCard } from "@/components/dashboard/AccountCard"

// 与 AccountCard 共用的控件风格（避免逐字段内联长 class 漂移）
const input = "mt-1 w-full px-3 py-2 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none"
const label = "text-xs text-[var(--dash-muted)]"

export default function SettingsPage(){
  const [form,setForm]=useState<any>(null)
  const [saving,setSaving]=useState(false)
  const { toast } = useToast()
  const { t, lang } = useLang()
  useEffect(()=>{fetch("/api/settings",{cache:"no-store"}).then(r=>r.json()).then(setForm)},[])
  const save=async()=>{
    setSaving(true)
    const r=await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)})
    setSaving(false)
    if(r.ok) toast(lang === "zh" ? "已保存" : "Saved","success"); else toast(lang === "zh" ? "保存失败" : "Save failed","error")
  }
  if(!form) return <SettingsPageSkeleton />
  return (
    <div className="max-w-4xl section-in">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--dash-text)] mb-6" style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}>{t.dashSettings}</h1>

      {/* 两卡并排一行（窄屏回退堆叠）；并排后卡内改单列窄栏，避免字段过窄 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* 站点设置 */}
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2.5 mb-5">
          <span className="w-5 h-px bg-[var(--dash-accent)]/60" aria-hidden />
          <h2 className="text-sm font-semibold tracking-wide text-[var(--dash-text)]">{lang === "zh" ? "站点设置" : "Site Settings"}</h2>
        </div>

        <div className="space-y-5">
          <div>
            <label className={label}>{lang === "zh" ? "站点名称" : "Site Name"}</label>
            <input value={form.siteName||""} onChange={e=>setForm({...form,siteName:e.target.value})} className={input} />
          </div>
          <div>
            <label className={label}>{lang === "zh" ? "关键词" : "Keywords"}</label>
            <input value={form.siteKeywords||""} onChange={e=>setForm({...form,siteKeywords:e.target.value})} className={input} />
          </div>
          <div>
            <label className={label}>{lang === "zh" ? "站点描述" : "Description"}</label>
            <input value={form.siteDescription||""} onChange={e=>setForm({...form,siteDescription:e.target.value})} className={input} />
          </div>
          <div>
            <label className={label}>Favicon URL</label>
            <input value={form.siteIconUrl||""} onChange={e=>setForm({...form,siteIconUrl:e.target.value})} className={input} placeholder="https://…" />
          </div>
          <div>
            <label className={label}>Logo URL</label>
            <input value={form.logoUrl||""} onChange={e=>setForm({...form,logoUrl:e.target.value})} className={input} placeholder="https://…" />
          </div>
          <div>
            <label className={label}>{lang === "zh" ? "页脚文案" : "Footer text"}</label>
            <input value={form.footerText||""} onChange={e=>setForm({...form,footerText:e.target.value})} className={input} />
          </div>
          <div>
            <label className={label}>{lang === "zh" ? "每页文章数" : "Posts per page"}</label>
            <input type="number" min={1} max={100} value={form.postsPerPage||10} onChange={e=>setForm({...form,postsPerPage:parseInt(e.target.value)||10})} className={input} />
          </div>
          <div>
            <label className={label}>{lang === "zh" ? "主题" : "Theme"}</label>
            <div className="mt-1">
              <DropdownSelect
                className="w-full"
                value={form.theme || "system"}
                onChange={(v) => setForm({ ...form, theme: v })}
                options={[
                  { value: "light", label: lang === "zh" ? "浅色" : "Light" },
                  { value: "dark", label: lang === "zh" ? "深色" : "Dark" },
                  { value: "system", label: lang === "zh" ? "跟随系统" : "System" },
                ]}
                ariaLabel={lang === "zh" ? "主题" : "Theme"}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={save} disabled={saving} className="px-6 py-2 bg-[var(--dash-text)] text-white text-sm rounded-none disabled:opacity-50 hover:opacity-90 font-medium">{saving ? (lang === "zh" ? "保存中…" : "Saving…") : (lang === "zh" ? "保存" : "Save")}</button>
        </div>
      </div>

      <AccountCard />
      </div>
    </div>
  )
}
