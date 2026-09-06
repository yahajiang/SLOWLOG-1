"use client"
import React from "react"
import type { PageConfig } from "@/lib/page-config"

// 颜色白名单：仅允许 hex / rgb(a) / hsl(a) / 纯英文命名色，挡掉 expression(/url(/var( 等注入
function safeColor(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined
  const s = v.trim()
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s)) return s
  if (/^(rgb|rgba|hsl|hsla)\(\s*[\d.,\s\/%]+\)$/.test(s)) return s
  if (/^[a-zA-Z]+$/.test(s) && s.length <= 20) return s
  return undefined
}

function renderInline(node: any, idx: number): React.ReactNode {
  if (node.type === "text") {
    let el: React.ReactNode = node.text
    const marks = node.marks || []
    for (const m of marks) {
      if (m.type === "bold") el = <strong key={idx + "-b"}>{el}</strong>
      if (m.type === "italic") el = <em key={idx + "-i"}>{el}</em>
      if (m.type === "code") el = <code key={idx + "-c"} className="mono text-[0.9em] px-[6px] py-[2px] mx-[1px] rounded-none bg-[var(--yh-border)]/40 border border-[var(--yh-border)]/60 text-[var(--yh-text)] align-middle">{el}</code>
      if (m.type === "underline") el = <u key={idx + "-u"}>{el}</u>
      if (m.type === "strike") el = <s key={idx + "-s"}>{el}</s>
      if (m.type === "textStyle") {
        const c = safeColor(m.attrs?.color)
        if (c) el = <span key={idx + "-t"} style={{ color: c }}>{el}</span>
      }
      if (m.type === "highlight") {
        const hc = safeColor(m.attrs?.color)
        el = hc
          ? <mark key={idx + "-h"} style={{ backgroundColor: hc }}>{el}</mark>
          : <mark key={idx + "-h"}>{el}</mark>
      }
      if (m.type === "link") {
        const href = m.attrs?.href || "#"
        const target = m.attrs?.target || undefined
        el = <a key={idx + "-a"} href={href} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined}>{el}</a>
      }
    }
    // also handle legacy Tiptap marks stored as marks array vs direct?
    return <React.Fragment key={idx}>{el}</React.Fragment>
  }
  if (node.type === "hardBreak") return <br key={idx} />
  return null
}

function CopyBtn({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <button
      onClick={async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1200) } catch {} }}
      className="px-3 py-1 rounded-none text-[11px] font-medium border bg-[#2a2a2e] text-[var(--yh-muted)] border-zinc-700 hover:bg-[#3a3a3e] hover:text-white hover:border-zinc-600 transition-colors flex items-center gap-1"
    >{copied ? "✓ 已复制" : "复制"}</button>
  )
}

function LangBadge({ lang }: { lang: string }) {
  const l = (lang || "text").toLowerCase()
  const map: Record<string, string> = {
    python: "bg-[#1e3a5f] text-[#7eb8f7] border-[#2a5a8a]",
    py: "bg-[#1e3a5f] text-[#7eb8f7] border-[#2a5a8a]",
    javascript: "bg-[#3a2e1a] text-[#f7c948] border-[#5a4a20]",
    typescript: "bg-[#1a3a4a] text-[#7eb8f7] border-[#2a5a7a]",
    shell: "bg-[#1a3a2e] text-[#7ec99a] border-[#2a5a3a]",
    bash: "bg-[#1a3a2e] text-[#7ec99a] border-[#2a5a3a]",
    text: "bg-[#2a2a2e] text-[var(--yh-muted)] border-zinc-700",
    txt: "bg-[#2a2a2e] text-[var(--yh-muted)] border-zinc-700",
  }
  const cls = map[l] || "bg-[#2a2a2e] text-[var(--yh-muted)] border-zinc-700"
  return <span className={`px-2.5 py-1 rounded-none text-[10px] font-semibold tracking-wider uppercase border ${cls}`}>{lang || "TEXT"}</span>
}

function renderNode(node: any, idx: number, primaryColor?: string, inTable?: boolean, isFirstPara?: boolean, isDarkMode?: boolean): React.ReactNode {
  const content = node.content || []
  const inline = content.map((c: any, i: number) => renderInline(c, i))

  switch (node.type) {
    case "heading": {
      const level = node.attrs?.level || 2
      const text = content.map((c: any) => c.text || "").join("").trim()
      const base = text.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "") || `heading-${idx}`
      // 简易去重：用 idx 保证唯一，实际与 posts.ts 的 seen 逻辑对齐
      const id = base
      const Tag = `h${level}` as any
      const cls =
        level === 1 ? "group text-3xl font-bold mt-[50px] mb-[18px] tracking-tight scroll-mt-[88px] flex items-center gap-2" :
        level === 2 ? "group text-[22px] font-semibold mt-[50px] mb-[11px] scroll-mt-[88px] tracking-tight border-b border-[var(--yh-border)] pb-[9px] flex items-center gap-2" :
        level === 3 ? "group text-lg font-semibold mt-[29px] mb-[7px] scroll-mt-[88px] flex items-center gap-2" :
        "group text-base font-semibold mt-[21px] mb-[7px] scroll-mt-[88px] flex items-center gap-2"
      return (
        <Tag key={idx} id={id} className={cls}>
          <a href={`#${id}`} aria-label=".Anchor" className="opacity-0 group-hover:opacity-100 -ml-5 pr-1 text-[var(--yh-muted)] hover:text-[var(--yh-accent)] transition-opacity mono text-[13px]">#</a>
          <span className="flex-1">{inline}</span>
        </Tag>
      )
    }
    case "paragraph":
      if (inTable) return <p key={idx} className="text-[13px] leading-[1.5] text-zinc-600 m-0">{inline.length ? inline : <br />}</p>
      return <p key={idx} data-paragraph className={`text-[17px] leading-[1.9] text-[var(--yh-text)]/85 mb-[22px] font-light transition-colors ${isFirstPara ? "first-letter:float-left first-letter:text-[3.2em] first-letter:font-serif first-letter:font-semibold first-letter:leading-[0.8] first-letter:mr-2 first-letter:mt-1.5" : ""}`}>{inline.length ? inline : <br />}</p>
    case "blockquote":
      return <blockquote key={idx} className="relative border-l-[3px] border-[var(--yh-accent)]/30 pl-6 text-[var(--yh-muted)] italic bg-[var(--yh-bg)]/60 py-[11px] pr-6 rounded-none my-[29px] text-[15px] leading-[1.85] overflow-hidden"><span className="absolute top-2 left-3 serif text-3xl leading-none select-none opacity-15" style={{ color: "var(--yh-accent)" }}>“</span>{content.map((c: any, i: number) => renderNode(c, i, primaryColor, false, false, isDarkMode))}</blockquote>
    case "codeBlock": {
      const lang = node.attrs?.language || ""
      const code = content.map((c: any) => c.text || "").join("")
      // 截图样式：深色 macOS 窗口 - 始终深色，保证可读性
      return (
        <div key={idx} className="my-[29px] rounded-none overflow-hidden border border-[#2a2a2e] shadow-[0_8px_30px_rgba(0,0,0,0.25)] bg-[#1E1E1E]">
          <div className="flex items-center justify-between px-4 py-[9px] bg-[#2d2d30] border-b border-[#3a3a3e]">
            <div className="flex items-center gap-3">
              <span className="flex gap-1.5">
                <span className="w-3 h-3 rounded-none bg-[#ff5f56] border border-[#e0443e]"></span>
                <span className="w-3 h-3 rounded-none bg-[#ffbd2e] border border-[#dea123]"></span>
                <span className="w-3 h-3 rounded-none bg-[#27ca3f] border border-[#1aab29]"></span>
              </span>
              <LangBadge lang={lang} />
            </div>
            <CopyBtn code={code} />
          </div>
          <pre data-language={lang} className="bg-[#1E1E1E] text-[#d4d4d4] p-[18px] overflow-x-auto m-0 border-0"><code className="text-[13.5px] leading-[1.7] font-mono !bg-transparent !border-0 !p-0 !rounded-none !text-[#d4d4d4]" style={{ background: 'transparent', color: '#d4d4d4' }}>{code}</code></pre>
        </div>
      )
    }
    case "bulletList":
      return <ul key={idx} className="list-disc pl-6 my-[18px] marker:text-[var(--yh-muted)] space-y-[5px] marker:text-[11px]">{content.map((c: any, i: number) => renderNode(c, i, primaryColor, false, false, isDarkMode))}</ul>
    case "orderedList":
      return <ol key={idx} className="list-decimal pl-6 my-[18px] marker:text-[var(--yh-muted)] marker:font-medium space-y-[5px]">{content.map((c: any, i: number) => renderNode(c, i, primaryColor, false, false, isDarkMode))}</ol>
    case "listItem": {
      if (inTable) return <li key={idx} className="text-[13px] leading-[1.5] mb-0">{content.map((c: any, i: number) => renderNode(c, i, primaryColor, true, false, isDarkMode))}</li>
      return <li key={idx} className="text-[16px] leading-[1.85] mb-[5px] marker:font-medium">{content.map((c: any, i: number) => renderNode(c, i, primaryColor, false, false, isDarkMode))}</li>
    }
    case "taskList":
      return <ul key={idx} data-type="taskList" className="list-none pl-0 my-[18px] space-y-[5px]">{content.map((c: any, i: number) => renderNode(c, i, primaryColor, false, false, isDarkMode))}</ul>
    case "taskItem": {
      const checked = node.attrs?.checked || false
      return <li key={idx} data-checked={checked} className="flex gap-2"><label className="mt-1"><input type="checkbox" checked={checked} readOnly className="w-[18px] h-[18px] rounded border-zinc-300" /></label> <div className="flex-1">{content.map((c: any, i: number) => renderNode(c, i, primaryColor, false, false, isDarkMode))}</div></li>
    }
    case "image": {
      const src = node.attrs?.src || ""
      const alt = node.attrs?.alt || ""
      const title = node.attrs?.title || ""
      const width = node.attrs?.width || null
      if (!src) return null
      return <figure key={idx} className="my-[32px] group/fig"><img src={src} alt={alt} title={title} loading="lazy" className="rounded-none border border-[var(--yh-border)] shadow-md block mx-auto cursor-zoom-in group-hover/fig:shadow-lg transition-shadow" style={{ margin: "0", ...(width ? { width } : { maxWidth: "100%" }) }} onClick={() => (window as any).__openLightbox?.(src)} />{alt && <figcaption className="text-center text-[13px] text-[var(--yh-muted)] mt-3 italic px-6">{alt}</figcaption>}{title && !alt && <figcaption className="text-center text-[13px] text-[var(--yh-muted)] mt-3 italic px-6">{title}</figcaption>}</figure>
    }
    case "horizontalRule":
      return <div key={idx} className="my-[43px] flex items-center gap-3"><span className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 to-transparent" /><span className="w-1 h-1 rounded-none bg-zinc-300" /><span className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 to-transparent" /></div>
    case "table": {
      const headerRows: any[] = []
      const bodyRows: any[] = []
      for (const child of content) {
        if (child.type === "tableRow") {
          const hasHeader = child.content?.some((c: any) => c.type === "tableHeader")
          if (hasHeader) headerRows.push(child)
          else bodyRows.push(child)
        }
      }
      return (
        <div key={idx} className="overflow-x-auto my-[29px] rounded-none border border-[var(--yh-border)] shadow-sm">
          <table className="w-full border-collapse text-[14px]">
            {headerRows.length > 0 && <thead>{headerRows.map((r, i) => renderNode(r, i, primaryColor, false, false, isDarkMode))}</thead>}
            <tbody>{bodyRows.map((r, i) => renderNode(r, i, primaryColor, false, false, isDarkMode))}</tbody>
          </table>
        </div>
      )
    }
    case "tableRow":
      return <tr key={idx} className="border-b border-[var(--yh-border)] last:border-0">{content.map((c: any, i: number) => renderNode(c, i, primaryColor, false, false, isDarkMode))}</tr>
    case "tableHeader":
      return <th key={idx} className="border border-[var(--yh-border)] bg-[var(--dash-card)] px-4 py-[9px] text-left font-semibold text-zinc-700 text-[13px]">{content.map((c: any, i: number) => renderNode(c, i, primaryColor, true, false, isDarkMode))}</th>
    case "tableCell":
      return <td key={idx} className="border border-[var(--yh-border)] px-4 py-[9px] text-zinc-600 align-top">{content.map((c: any, i: number) => renderNode(c, i, primaryColor, true, false, isDarkMode))}</td>
    default:
      // fallback: try render content
      if (content.length) return <div key={idx}>{content.map((c: any, i: number) => renderNode(c, i, primaryColor, false, false, isDarkMode))}</div>
      return null
  }
}

export function PostRenderer({ content, pageConfig }: { content: unknown; pageConfig?: PageConfig | null }) {
  if (!content || typeof content !== "object") return null
  const doc = content as any
  const nodes: any[] = doc.content || doc.root?.children || []
  if (!Array.isArray(nodes) || nodes.length === 0) return <p className="text-sm text-[var(--yh-muted)]">暂无内容</p>

  const pc = pageConfig
  const maxW = pc?.maxWidth === "narrow" ? "max-w-2xl" : pc?.maxWidth === "wide" ? "max-w-none" : "max-w-none"
  const font = pc?.fontFamily === "serif" ? "font-serif" : ""
  const bg = pc?.backgroundColor && pc.backgroundColor !== "#FFFFFF" ? pc.backgroundColor : "transparent"
  // 首段下沉仅在 serif 且非全屏时
  const firstParaIdx = nodes.findIndex((n: any) => n.type === "paragraph")

  return (
    <div
      className={`max-w-none ${maxW} ${font} ${isDark(pc) ? "text-zinc-100" : "text-zinc-900"}`}
      style={{ backgroundColor: bg, ...(pc?.primaryColor ? { ["--yh-accent" as any]: pc.primaryColor } : {}) }}
    >
      {nodes.map((n, i) => renderNode(n, i, pc?.primaryColor, false, i === firstParaIdx && pc?.fontFamily === "serif", isDark(pc)))}
    </div>
  )
}

function isDark(pc?: PageConfig | null) { return pc?.theme === "dark" }
