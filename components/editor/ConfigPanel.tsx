"use client"
import type { PageConfig } from "@/lib/page-config"

export function ConfigPanel({ value, onChange }: { value: PageConfig; onChange: (v: PageConfig) => void }) {
  const set = (patch: Partial<PageConfig>) => onChange({ ...value, ...patch })
  return (
    <div className="w-[320px] shrink-0 bg-[var(--dash-card)] border-l border-[var(--dash-border)] h-full overflow-y-auto p-6 space-y-6 shadow-[var(--shadow-card)]">
      <h3 className="text-sm font-semibold tracking-tight text-[var(--dash-text)]" style={{ fontFamily: "MiSans, sans-serif" }}>页面设置</h3>

      <div>
        <p className="text-xs font-medium text-[var(--dash-text)] mb-2">布局模板</p>
        <div className="grid grid-cols-3 gap-2">
          {(["standard","magazine","fullscreen"] as const).map(k=>(
            <button key={k} onClick={()=>set({layout:k})} className={`px-3 py-2 text-xs border rounded-[var(--radius-sm)] font-medium transition-colors ${value.layout===k?"bg-[var(--dash-accent)] text-white border-[var(--dash-accent)]":"bg-white border-[var(--dash-border)] hover:bg-zinc-50"}`} >{k}</button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--dash-text)] mb-2">主题</p>
        <label className="flex items-center gap-2 text-sm text-[var(--dash-text)]"><input type="checkbox" checked={value.theme==="dark"} onChange={e=>set({theme:e.target.checked?"dark":"light"})} className="accent-[var(--dash-accent)]" /> 深色</label>
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--dash-text)] mb-2">主色</p>
        <input type="color" value={value.primaryColor} onChange={e=>set({primaryColor:e.target.value})} className="w-full h-8 rounded-[var(--radius-sm)] border border-[var(--dash-border)]" />
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--dash-text)] mb-2">字体</p>
        <div className="flex gap-2">
          <button onClick={()=>set({fontFamily:"sans"})} className={`flex-1 py-2 text-xs border rounded-[var(--radius-sm)] font-medium ${value.fontFamily==="sans"?"bg-[var(--dash-text)] text-white border-[var(--dash-text)]":"bg-white border-[var(--dash-border)] hover:bg-zinc-50"}`}>无衬线</button>
          <button onClick={()=>set({fontFamily:"serif"})} className={`flex-1 py-2 text-xs border rounded-[var(--radius-sm)] font-medium ${value.fontFamily==="serif"?"bg-[var(--dash-text)] text-white border-[var(--dash-text)]":"bg-white border-[var(--dash-border)] hover:bg-zinc-50"}`}>衬线</button>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--dash-text)] mb-2">背景色</p>
        <input type="color" value={value.backgroundColor} onChange={e=>set({backgroundColor:e.target.value})} className="w-full h-8 rounded-[var(--radius-sm)] border border-[var(--dash-border)]" />
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--dash-text)] mb-2">内容宽度</p>
        <div className="flex gap-2">
          {(["narrow","medium","wide"] as const).map(k=>(
            <button key={k} onClick={()=>set({maxWidth:k})} className={`flex-1 py-2 text-xs border rounded-[var(--radius-sm)] font-medium ${value.maxWidth===k?"bg-[var(--dash-text)] text-white border-[var(--dash-text)]":"bg-white border-[var(--dash-border)] hover:bg-zinc-50"}`}>{k}</button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--dash-text)]"><input type="checkbox" checked={value.showTOC} onChange={e=>set({showTOC:e.target.checked})} className="accent-[var(--dash-accent)]" /> 显示目录</label>

      <p className="text-xs text-[var(--dash-muted)] pt-4 border-t border-[var(--dash-border)]">修改实时生效到预览区与前台（统一 PostRenderer）</p>
    </div>
  )
}
