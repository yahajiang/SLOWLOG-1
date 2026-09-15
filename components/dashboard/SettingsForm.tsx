"use client"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/Toast"
import { DropdownSelect } from "@/components/ui/DropdownSelect"
import { useLang } from "@/lib/lang-context"
import { SettingsPageSkeleton } from "@/components/dashboard/Skeleton"
import { AccountCard } from "@/components/dashboard/AccountCard"

// 与 AccountCard 共用的控件风格（避免逐字段内联长 class 漂移）
const input = "mt-1 w-full px-3 py-2 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none"
// 行内输入（社交链接行）：不带 w-full——名称列固定宽、URL 列 flex 占满，
// 否则 w-full 与 w-28 同属性冲突，URL 框会被挤瘪
const rowInput = "px-3 py-2 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none"
const label = "text-xs text-[var(--dash-muted)]"

/** 编辑板块：全宽卡片（占满行宽）+ 板块内字段两列栅格，板块间依次堆叠——
    无锯齿、无右侧留白；节头 + 「作用于」说明对应前台消费位置 */
function Section({ title, applies, children }: {
  title: string;
  applies: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2.5">
        <span className="w-5 h-px bg-[var(--dash-accent)]/60" aria-hidden />
        <h2 className="text-sm font-semibold tracking-wide text-[var(--dash-text)]">{title}</h2>
      </div>
      <p className="text-[11px] text-[var(--dash-muted)] mt-1.5">{applies}</p>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">{children}</div>
    </div>
  )
}

/** 板块内跨两列的字段（长文本用） */
function Full({ children }: { children: React.ReactNode }) {
  return <div className="sm:col-span-2">{children}</div>
}

type SocialLink = { name: string; url: string }

export function SettingsForm() {
  const [form,setForm]=useState<any>(null)
  const [saving,setSaving]=useState(false)
  const { toast } = useToast()
  const { lang } = useLang()
  useEffect(()=>{fetch("/api/settings",{cache:"no-store"}).then(r=>r.json()).then(setForm)},[])

  // 社交链接编辑（保存时随 form 一起 PUT；schema 限 10 条、http(s) 前缀）
  const links: SocialLink[] = Array.isArray(form?.socialLinks) ? form.socialLinks : []
  const setLink=(i:number, patch: Partial<SocialLink>)=>{
    const arr=[...links]; arr[i]={...arr[i], ...patch}
    setForm({...form, socialLinks: arr})
  }
  const addLink=()=>setForm({...form, socialLinks:[...links, { name:"", url:"https://" }]})
  const delLink=(i:number)=>setForm({...form, socialLinks: links.filter((_:SocialLink,j:number)=>j!==i)})

  const save=async()=>{
    setSaving(true)
    const r=await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)})
    setSaving(false)
    if(r.ok) toast(lang === "zh" ? "已保存" : "Saved","success"); else {
      const j=await r.json().catch(()=>({}))
      toast(j.error || (lang === "zh" ? "保存失败" : "Save failed"),"error")
    }
  }
  if(!form) return <SettingsPageSkeleton />
  return (
    <div className="space-y-6">
      <Section
        title={lang === "zh" ? "站点信息" : "Site Info"}
        applies={lang === "zh" ? "作用于：浏览器标题 · 顶部导航 · 搜索引擎摘要 · RSS" : "Applies to: browser title · header · SEO snippets · RSS"}
      >
        <div>
          <label className={label}>{lang === "zh" ? "站点名称" : "Site Name"}</label>
          <input value={form.siteName||""} onChange={e=>setForm({...form,siteName:e.target.value})} className={input} />
        </div>
        <div>
          <label className={label}>{lang === "zh" ? "英文站名" : "Site Name (EN)"}</label>
          <input value={form.siteNameEn||""} onChange={e=>setForm({...form,siteNameEn:e.target.value})} className={input} placeholder="SlowLog" />
        </div>
        <Full>
          <label className={label}>{lang === "zh" ? "站点描述" : "Description"}</label>
          <input value={form.siteDescription||""} onChange={e=>setForm({...form,siteDescription:e.target.value})} className={input} />
        </Full>
        <Full>
          <label className={label}>{lang === "zh" ? "英文描述" : "Description (EN)"}</label>
          <input value={form.siteDescriptionEn||""} onChange={e=>setForm({...form,siteDescriptionEn:e.target.value})} className={input} />
        </Full>
        <div>
          <label className={label}>{lang === "zh" ? "关键词" : "Keywords"}</label>
          <input value={form.siteKeywords||""} onChange={e=>setForm({...form,siteKeywords:e.target.value})} className={input} />
        </div>
      </Section>

      <Section
        title={lang === "zh" ? "页脚" : "Footer"}
        applies={lang === "zh" ? "作用于：全站页脚文案与社交链接（英文访客显示英文侧）" : "Applies to: footer text & social links (EN side for English visitors)"}
      >
        <div>
          <label className={label}>{lang === "zh" ? "页脚文案" : "Footer text"}</label>
          <input value={form.footerText||""} onChange={e=>setForm({...form,footerText:e.target.value})} className={input} />
        </div>
        <div>
          <label className={label}>{lang === "zh" ? "页脚文案（英文）" : "Footer text (EN)"}</label>
          <input value={form.footerTextEn||""} onChange={e=>setForm({...form,footerTextEn:e.target.value})} className={input} />
        </div>
        <Full>
          <label className={label}>{lang === "zh" ? "社交链接" : "Social links"}</label>
          <div className="mt-1 space-y-2">
            {links.map((l, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={l.name} onChange={e=>setLink(i,{name:e.target.value})} className={`${rowInput} w-32 shrink-0`} placeholder={lang === "zh" ? "名称" : "Name"} />
                <input value={l.url} onChange={e=>setLink(i,{url:e.target.value})} className={`${rowInput} flex-1 min-w-0`} placeholder="https://…" />
                <button onClick={()=>delLink(i)} title={lang === "zh" ? "删除" : "Remove"} className="shrink-0 w-8 h-8 flex items-center justify-center text-[var(--dash-muted)] hover:text-red-600 hover:bg-red-50 border border-[var(--dash-border)] rounded-none transition-colors" aria-label={lang === "zh" ? "删除社交链接" : "Remove social link"}>×</button>
              </div>
            ))}
            {links.length < 10 && (
              <button onClick={addLink} className="text-xs px-3 py-1.5 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] hover:bg-[var(--dash-bg)] text-[var(--dash-muted)] hover:text-[var(--dash-text)] transition-colors">
                + {lang === "zh" ? "添加链接" : "Add link"}
              </button>
            )}
          </div>
        </Full>
      </Section>

      <Section
        title={lang === "zh" ? "品牌资源" : "Brand Assets"}
        applies={lang === "zh" ? "作用于：浏览器标签图标（Favicon）· 顶部导航 Logo（留空用内置 S 章）" : "Applies to: favicon & header logo (empty = built-in mark)"}
      >
        <div>
          <label className={label}>Favicon URL</label>
          <input value={form.siteIconUrl||""} onChange={e=>setForm({...form,siteIconUrl:e.target.value})} className={input} placeholder="https://…" />
        </div>
        <div>
          <label className={label}>Logo URL</label>
          <input value={form.logoUrl||""} onChange={e=>setForm({...form,logoUrl:e.target.value})} className={input} placeholder="https://…" />
        </div>
      </Section>

      <Section
        title={lang === "zh" ? "阅读与外观" : "Reading & Appearance"}
        applies={lang === "zh" ? "作用于：后台文章列表分页 · 访客未选择主题时的默认外观" : "Applies to: dashboard pagination & default theme for visitors"}
      >
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
      </Section>

      <AccountCard />

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="px-8 py-2.5 bg-[var(--dash-text)] text-white text-sm rounded-none disabled:opacity-50 hover:opacity-90 font-medium">{saving ? (lang === "zh" ? "保存中…" : "Saving…") : (lang === "zh" ? "保存全部设置" : "Save all")}</button>
      </div>
    </div>
  )
}
