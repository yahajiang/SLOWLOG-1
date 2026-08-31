"use client"
import React from "react"
import type { PageConfig } from "@/lib/page-config"

function renderInline(node: any, idx: number): React.ReactNode {
  if (node.type === "text") {
    let el: React.ReactNode = node.text
    const marks = node.marks || []
    for (const m of marks) {
      if (m.type === "bold") el = <strong key={idx + "-b"}>{el}</strong>
      if (m.type === "italic") el = <em key={idx + "-i"}>{el}</em>
      if (m.type === "code") el = <code key={idx + "-c"}>{el}</code>
      if (m.type === "underline") el = <u key={idx + "-u"}>{el}</u>
      if (m.type === "strike") el = <s key={idx + "-s"}>{el}</s>
      if (m.type === "highlight") el = <mark key={idx + "-h"}>{el}</mark>
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

function renderNode(node: any, idx: number, primaryColor?: string, inTable?: boolean): React.ReactNode {
  const content = node.content || []
  const inline = content.map((c: any, i: number) => renderInline(c, i))

  switch (node.type) {
    case "heading": {
      const level = node.attrs?.level || 2
      const text = content.map((c: any) => c.text || "").join("")
      const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, "-").replace(/^-|-$/g, "")
      const Tag = `h${level}` as any
      const cls =
        level === 1 ? "text-3xl font-bold mt-14 mb-5 tracking-tight scroll-mt-24" :
        level === 2 ? "text-xl font-semibold mt-14 mb-3 scroll-mt-24 tracking-tight border-b border-zinc-100 pb-2" :
        level === 3 ? "text-lg font-semibold mt-8 mb-2 scroll-mt-24" :
        "text-base font-semibold mt-6 mb-2 scroll-mt-24"
      return <Tag key={idx} id={id} className={cls}>{inline}</Tag>
    }
    case "paragraph":
      if (inTable) return <p key={idx} className="text-[13px] leading-[1.5] text-zinc-600 m-0">{inline.length ? inline : <br />}</p>
      return <p key={idx} className="text-[16px] leading-[1.9] text-[var(--yh-text)]/85 mb-6 font-light">{inline.length ? inline : <br />}</p>
    case "blockquote":
      return <blockquote key={idx} className="border-l-[3px] border-[var(--yh-accent)]/30 pl-5 text-zinc-500 italic bg-zinc-50/50 py-2 pr-4 rounded-r-lg my-8 text-[15px] leading-[1.8]">{content.map((c: any, i: number) => renderNode(c, i))}</blockquote>
    case "codeBlock": {
      const lang = node.attrs?.language || ""
      const code = content.map((c: any) => c.text || "").join("")
      return <pre key={idx} data-language={lang} className="bg-zinc-900 text-zinc-100 p-5 rounded-xl overflow-x-auto border border-zinc-800 shadow-lg my-8 relative group"><code className="text-[13.5px] leading-[1.7]">{code}</code>{lang && <span className="absolute top-0 right-0 px-2.5 py-1 text-[10px] font-medium tracking-wider uppercase text-zinc-500 bg-zinc-800 rounded-bl-lg">{lang}</span>}</pre>
    }
    case "bulletList":
      return <ul key={idx} className="list-disc pl-6 my-4 marker:text-zinc-400 space-y-1">{content.map((c: any, i: number) => renderNode(c, i))}</ul>
    case "orderedList":
      return <ol key={idx} className="list-decimal pl-6 my-4 marker:text-zinc-400 space-y-1">{content.map((c: any, i: number) => renderNode(c, i))}</ol>
    case "listItem": {
      if (inTable) return <li key={idx} className="text-[13px] leading-[1.5] mb-0">{content.map((c: any, i: number) => renderNode(c, i, primaryColor, true))}</li>
      return <li key={idx} className="text-[15px] leading-[1.8] mb-1">{content.map((c: any, i: number) => renderNode(c, i, primaryColor))}</li>
    }
    case "taskList":
      return <ul key={idx} data-type="taskList" className="list-none pl-0 my-4 space-y-1">{content.map((c: any, i: number) => renderNode(c, i))}</ul>
    case "taskItem": {
      const checked = node.attrs?.checked || false
      return <li key={idx} data-checked={checked}><label><input type="checkbox" checked={checked} readOnly /></label> <div>{content.map((c: any, i: number) => renderNode(c, i))}</div></li>
    }
    case "image": {
      const src = node.attrs?.src || ""
      const alt = node.attrs?.alt || ""
      const title = node.attrs?.title || ""
      const width = node.attrs?.width || null
      if (!src) return null
      return <figure key={idx} className="my-8"><img src={src} alt={alt} title={title} loading="lazy" className="rounded-xl border border-zinc-200 shadow-md block mx-auto" style={{ margin: "0", ...(width ? { width } : { maxWidth: "100%" }) }} />{alt && <figcaption className="text-center text-[13px] text-zinc-400 mt-3 italic">{alt}</figcaption>}</figure>
    }
    case "horizontalRule":
      return <hr key={idx} className="my-12 border-none h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
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
        <div key={idx} className="overflow-x-auto my-8 rounded-xl border border-zinc-200 shadow-sm">
          <table className="w-full border-collapse text-[14px]">
            {headerRows.length > 0 && <thead>{headerRows.map((r, i) => renderNode(r, i))}</thead>}
            <tbody>{bodyRows.map((r, i) => renderNode(r, i))}</tbody>
          </table>
        </div>
      )
    }
    case "tableRow":
      return <tr key={idx} className="border-b border-zinc-200 last:border-0">{content.map((c: any, i: number) => renderNode(c, i))}</tr>
    case "tableHeader":
      return <th key={idx} className="border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-left font-semibold text-zinc-700 text-[13px]">{content.map((c: any, i: number) => renderNode(c, i, primaryColor, true))}</th>
    case "tableCell":
      return <td key={idx} className="border border-zinc-200 px-4 py-2.5 text-zinc-600 align-top">{content.map((c: any, i: number) => renderNode(c, i, primaryColor, true))}</td>
    default:
      // fallback: try render content
      if (content.length) return <div key={idx}>{content.map((c: any, i: number) => renderNode(c, i))}</div>
      return null
  }
}

export function PostRenderer({ content, pageConfig }: { content: unknown; pageConfig?: PageConfig | null }) {
  if (!content || typeof content !== "object") return null
  const doc = content as any
  const nodes: any[] = doc.content || doc.root?.children || []
  if (!Array.isArray(nodes) || nodes.length === 0) return <p className="text-sm text-zinc-400">暂无内容</p>

  const pc = pageConfig
  const maxW = pc?.maxWidth === "narrow" ? "max-w-2xl" : pc?.maxWidth === "wide" ? "max-w-5xl" : "max-w-3xl"
  const font = pc?.fontFamily === "serif" ? "font-serif" : ""
  const bg = pc?.backgroundColor || "#FFFFFF"

  return (
    <div
      className={`max-w-none ${maxW} ${font} ${isDark(pc) ? "text-zinc-100" : "text-zinc-900"}`}
      style={{ backgroundColor: bg, ...(pc?.primaryColor ? { ["--yh-accent" as any]: pc.primaryColor } : {}) }}
    >
      {nodes.map((n, i) => renderNode(n, i, pc?.primaryColor))}
    </div>
  )
}

function isDark(pc?: PageConfig | null) { return pc?.theme === "dark" }
