"use client"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import Typography from "@tiptap/extension-typography"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import Highlight from "@tiptap/extension-highlight"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import { Table } from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import { common, createLowlight } from "lowlight"
import { useEffect, useRef, useState } from "react"
import { PromptDialog } from "@/components/ui/Dialog"
import { useToast } from "@/components/ui/Toast"
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ResizableImageView } from "./ResizableImageView"
import { ColorPicker } from "./ColorPicker"
import {
  Bold, Italic, Underline as UnderlineIcon, Highlighter, Code2,
  Heading1, Heading2, Heading3, Heading4, Quote,
  List, ListOrdered, CheckSquare,
  Link as LinkIcon, Image as ImageIcon, Minus, Upload,
  Undo2, Redo2, AlignLeft, AlignCenter, AlignRight,
  Table as TableIcon, Paintbrush, Eraser, ChevronDown, Type
} from "lucide-react"

const lowlight = createLowlight(common)

const ResizableImage = Image.extend({
  draggable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el: any) => el.getAttribute("width") || el.style.width || null,
        renderHTML: (attrs: any) => {
          if (!attrs.width) return {}
          return { style: `width: ${attrs.width}` }
        },
      },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView)
  },
})

async function uploadImageFile(file: File): Promise<string> {
  const fd = new FormData()
  fd.append("file", file)
  const res = await fetch("/api/media", { method: "POST", body: fd })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    throw new Error(j.error || "上传失败")
  }
  const data = await res.json()
  const item = Array.isArray(data) ? data[0] : data
  return item.url as string
}

export function TiptapEditor({ content, onUpdate, editable = true }: { content: any; onUpdate: (json: any) => void; editable?: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [imageUrlOpen, setImageUrlOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [titleOpen, setTitleOpen] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [alignOpen, setAlignOpen] = useState(false)
  const [textColorOpen, setTextColorOpen] = useState(false)
  const [highlightColorOpen, setHighlightColorOpen] = useState(false)
  const { toast } = useToast()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, heading: { levels: [1, 2, 3, 4] }, link: false, underline: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      ResizableImage.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: "输入 / 呼出命令，支持标题、列表、图片、表格...  选中文字可单独设置粗体/高亮" }),
      Typography,
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Highlight.configure({ multicolor: true }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content || { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] },
    editable,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    onUpdate: ({ editor }) => onUpdate(editor.getJSON()),
  })

  useEffect(() => {
    if (editor && content) {
      if (!editor.isFocused) {
        const cur = JSON.stringify(editor.getJSON())
        const next = JSON.stringify(content)
        if (cur !== next) editor.commands.setContent(content)
      }
    }
  }, [content, editor])

  const handleFiles = async (files: FileList | File[]) => {
    if (!editor) return
    const list = Array.from(files as FileList).filter((f) => f.type.startsWith("image/"))
    if (!list.length) return
    setUploading(true)
    for (const file of list) {
      if (file.size > 5 * 1024 * 1024) { toast("单张上限 5MB", "error"); continue }
      try {
        const url = await uploadImageFile(file)
        editor.chain().focus().setImage({ src: url, alt: file.name }).run()
        toast("图片已插入", "success")
      } catch (e: any) { toast(e.message || "上传失败", "error") }
    }
    setUploading(false)
  }

  useEffect(() => {
    if (!editor) return
    const el = document.querySelector(".tiptap-editor .ProseMirror") as HTMLElement | null
    if (!el) return
    const onDrop = (e: DragEvent) => {
      if (!e.dataTransfer?.files.length) return
      if (!Array.from(e.dataTransfer.files).some((f) => f.type.startsWith("image/"))) return
      e.preventDefault()
      handleFiles(e.dataTransfer.files)
    }
    const onPaste = (e: ClipboardEvent) => {
      const imgs = e.clipboardData?.files ? Array.from(e.clipboardData.files).filter((f) => f.type.startsWith("image/")) : []
      if (imgs.length) { e.preventDefault(); handleFiles(imgs as unknown as FileList) }
    }
    el.addEventListener("drop", onDrop as any)
    el.addEventListener("paste", onPaste as any)
    return () => { el.removeEventListener("drop", onDrop as any); el.removeEventListener("paste", onPaste as any) }
  }, [editor])

  if (!editor) return <div className="p-8 text-sm text-[var(--yh-muted)]">加载编辑器...</div>

  const toolbarBtn = (icon: React.ReactNode, label: string, active: boolean, action: () => void) => (
    <button key={label} title={label} onMouseDown={(e) => e.preventDefault()} onClick={action}
      className={`p-1.5 rounded transition-colors ${active ? "bg-[var(--yh-text)] text-[var(--yh-bg)]" : "text-[var(--yh-text)] hover:bg-zinc-100"}`}
    >{icon}</button>
  )

  return (
    <div className="tiptap-editor">
      {/* BubbleMenu 选中文字浮出 */}
      <BubbleMenu editor={editor} shouldShow={({ state }) => !state.selection.empty} className="flex items-center gap-0.5 p-1 bg-zinc-900 text-white rounded-xl shadow-xl border border-zinc-700">
        {[
          { icon: <Bold className="w-3.5 h-3.5" />, label: "粗体", action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
          { icon: <Italic className="w-3.5 h-3.5" />, label: "斜体", action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
          { icon: <UnderlineIcon className="w-3.5 h-3.5" />, label: "下划线", action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline") },
          { icon: <Highlighter className="w-3.5 h-3.5" />, label: "高亮", action: () => editor.chain().focus().toggleHighlight().run(), active: editor.isActive("highlight") },
        ].map((item) => (
          <button key={item.label} title={item.label} onMouseDown={(e) => e.preventDefault()} onClick={item.action}
            className={`p-1.5 rounded-lg transition-colors ${item.active ? "bg-white text-zinc-900" : "hover:bg-zinc-700"}`}>{item.icon}</button>
        ))}
        <div className="w-px h-4 bg-zinc-600 mx-0.5" />
        <button title="行内代码" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive("code") ? "bg-white text-zinc-900" : "hover:bg-zinc-700"}`}><Code2 className="w-3.5 h-3.5" /></button>
        <button title="链接" onMouseDown={(e) => e.preventDefault()} onClick={() => setLinkOpen(true)}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive("link") ? "bg-white text-zinc-900" : "hover:bg-zinc-700"}`}><LinkIcon className="w-3.5 h-3.5" /></button>
      </BubbleMenu>

      {/* FloatingMenu 空行 */}
      <FloatingMenu editor={editor} className="flex items-center gap-0.5 p-1 bg-[var(--yh-bg)] border border-[var(--yh-border)] rounded-lg shadow-sm">
        <button title="H2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="p-1.5 rounded hover:bg-zinc-50"><Heading2 className="w-3.5 h-3.5" /></button>
        <button title="列表" onClick={() => editor.chain().focus().toggleBulletList().run()} className="p-1.5 rounded hover:bg-zinc-50"><List className="w-3.5 h-3.5" /></button>
        <button title="图片" onClick={() => fileRef.current?.click()} className="p-1.5 rounded hover:bg-zinc-50"><ImageIcon className="w-3.5 h-3.5" /></button>
        <button title="代码块" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className="p-1.5 rounded hover:bg-zinc-50"><Code2 className="w-3.5 h-3.5" /></button>
      </FloatingMenu>

      {/* 工具栏 - 固定在顶部 */}
      <div className="bg-white border-b border-[var(--yh-border)] px-4 py-1.5 flex flex-wrap items-center gap-0.5 sticky top-0 z-10 shadow-sm">
          {/* 标题下拉 */}
          <div className="relative">
            <button title="标题" onMouseDown={(e) => e.preventDefault()} onClick={() => { setTitleOpen(!titleOpen); setListOpen(false); setAlignOpen(false); setTextColorOpen(false); setHighlightColorOpen(false); }}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-sm transition-all duration-150 ${editor.isActive("heading") ? "bg-violet-100 text-violet-700" : "text-zinc-600 hover:bg-zinc-100"}`}>
              <Type className="w-4 h-4" />
              <span className="text-xs font-medium">{editor.isActive("heading", { level: 1 }) ? "H1" : editor.isActive("heading", { level: 2 }) ? "H2" : editor.isActive("heading", { level: 3 }) ? "H3" : editor.isActive("heading", { level: 4 }) ? "H4" : "标题"}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {titleOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-50 min-w-[120px]">
                {[
                  { level: 1 as const, label: "标题 1", icon: <Heading1 className="w-4 h-4" /> },
                  { level: 2 as const, label: "标题 2", icon: <Heading2 className="w-4 h-4" /> },
                  { level: 3 as const, label: "标题 3", icon: <Heading3 className="w-4 h-4" /> },
                  { level: 4 as const, label: "标题 4", icon: <Heading4 className="w-4 h-4" /> },
                  { level: 0 as const, label: "正文", icon: <Type className="w-4 h-4" /> },
                ].map((item) => (
                  <button key={item.level} onMouseDown={(e) => e.preventDefault()} onClick={() => {
                    if (item.level === 0) editor.chain().focus().setParagraph().run()
                    else editor.chain().focus().toggleHeading({ level: item.level }).run()
                    setTitleOpen(false)
                  }} className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-zinc-50 ${editor.isActive("heading", { level: item.level }) || (item.level === 0 && editor.isActive("paragraph") && !editor.isActive("heading")) ? "bg-violet-50 text-violet-700" : "text-zinc-700"}`}>
                    {item.icon}<span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-zinc-200 mx-0.5" />

          {/* 文本格式 */}
          {[
            { icon: <Bold className="w-4 h-4" />, label: "粗体", active: editor.isActive("bold"), action: () => editor.chain().focus().toggleBold().run() },
            { icon: <Italic className="w-4 h-4" />, label: "斜体", active: editor.isActive("italic"), action: () => editor.chain().focus().toggleItalic().run() },
            { icon: <UnderlineIcon className="w-4 h-4" />, label: "下划线", active: editor.isActive("underline"), action: () => editor.chain().focus().toggleUnderline().run() },
          ].map((item) => (
            <button key={item.label} title={item.label} onMouseDown={(e) => e.preventDefault()} onClick={item.action}
              className={`p-1.5 rounded-md transition-all duration-150 ${item.active ? "bg-amber-100 text-amber-700" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"}`}>
              {item.icon}
            </button>
          ))}

          <div className="w-px h-4 bg-zinc-200 mx-0.5" />

          {/* 链接/图片 */}
          <button title="链接" onMouseDown={(e) => e.preventDefault()} onClick={() => setLinkOpen(true)}
            className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-all duration-150"><LinkIcon className="w-4 h-4" /></button>
          <button title="图片" onMouseDown={(e) => e.preventDefault()} onClick={() => fileRef.current?.click()} disabled={uploading}
            className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-all duration-150 disabled:opacity-50"><Upload className="w-4 h-4" /></button>

          <div className="w-px h-4 bg-zinc-200 mx-0.5" />

          {/* 列表下拉 */}
          <div className="relative">
            <button title="列表" onMouseDown={(e) => e.preventDefault()} onClick={() => { setListOpen(!listOpen); setTitleOpen(false); setAlignOpen(false); setTextColorOpen(false); setHighlightColorOpen(false); }}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-sm transition-all duration-150 ${editor.isActive("bulletList") || editor.isActive("orderedList") || editor.isActive("taskList") ? "bg-emerald-100 text-emerald-700" : "text-zinc-600 hover:bg-zinc-100"}`}>
              <List className="w-4 h-4" />
              <span className="text-xs font-medium">{editor.isActive("bulletList") ? "无序" : editor.isActive("orderedList") ? "有序" : editor.isActive("taskList") ? "任务" : "列表"}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {listOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-50 min-w-[120px]">
                {[
                  { action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList"), label: "无序列表", icon: <List className="w-4 h-4" /> },
                  { action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList"), label: "有序列表", icon: <ListOrdered className="w-4 h-4" /> },
                  { action: () => editor.chain().focus().toggleTaskList().run(), active: editor.isActive("taskList"), label: "任务列表", icon: <CheckSquare className="w-4 h-4" /> },
                ].map((item) => (
                  <button key={item.label} onMouseDown={(e) => e.preventDefault()} onClick={() => { item.action(); setListOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-zinc-50 ${item.active ? "bg-emerald-50 text-emerald-700" : "text-zinc-700"}`}>
                    {item.icon}<span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-zinc-200 mx-0.5" />

          {/* 文字颜色 */}
          <div className="relative">
            <button title="文字颜色" onMouseDown={(e) => e.preventDefault()} onClick={() => { setTextColorOpen(!textColorOpen); setTitleOpen(false); setListOpen(false); setAlignOpen(false); setHighlightColorOpen(false); }}
              className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-all duration-150">
              <Paintbrush className="w-4 h-4" />
            </button>
            {textColorOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 w-[280px]">
                <ColorPicker
                  value={editor.getAttributes("textStyle").color}
                  onChange={(color) => editor.chain().focus().setColor(color).run()}
                  onReset={() => editor.chain().focus().unsetColor().run()}
                  label="文字颜色"
                />
              </div>
            )}
          </div>

          {/* 背景高亮颜色 */}
          <div className="relative">
            <button title="背景高亮" onMouseDown={(e) => e.preventDefault()} onClick={() => { setHighlightColorOpen(!highlightColorOpen); setTitleOpen(false); setListOpen(false); setAlignOpen(false); setTextColorOpen(false); }}
              className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-all duration-150">
              <Highlighter className="w-4 h-4" />
            </button>
            {highlightColorOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 w-[280px]">
                <ColorPicker
                  value={editor.isActive("highlight") ? editor.getAttributes("highlight").color : undefined}
                  onChange={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
                  onReset={() => editor.chain().focus().unsetHighlight().run()}
                  label="背景高亮"
                />
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-zinc-200 mx-0.5" />

          {/* 对齐方式下拉 */}
          <div className="relative">
            <button title="对齐方式" onMouseDown={(e) => e.preventDefault()} onClick={() => { setAlignOpen(!alignOpen); setTitleOpen(false); setListOpen(false); setTextColorOpen(false); setHighlightColorOpen(false); }}
              className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-all duration-150">
              <AlignLeft className="w-4 h-4" />
            </button>
            {alignOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-50 min-w-[100px]">
                {[
                  { action: () => editor.chain().focus().setTextAlign("left").run(), active: editor.isActive({ textAlign: "left" }), label: "左", icon: <AlignLeft className="w-4 h-4" /> },
                  { action: () => editor.chain().focus().setTextAlign("center").run(), active: editor.isActive({ textAlign: "center" }), label: "中", icon: <AlignCenter className="w-4 h-4" /> },
                  { action: () => editor.chain().focus().setTextAlign("right").run(), active: editor.isActive({ textAlign: "right" }), label: "右", icon: <AlignRight className="w-4 h-4" /> },
                ].map((item) => (
                  <button key={item.label} onMouseDown={(e) => e.preventDefault()} onClick={() => { item.action(); setAlignOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-zinc-50 ${item.active ? "bg-blue-50 text-blue-700" : "text-zinc-700"}`}>
                    {item.icon}<span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-zinc-200 mx-0.5" />

          {/* 表格/引用/代码/分割线/清除/撤销/重做 */}
          <button title="插入表格" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-all duration-150"><TableIcon className="w-4 h-4" /></button>
          <button title="引用" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-md transition-all duration-150 ${editor.isActive("blockquote") ? "bg-cyan-100 text-cyan-700" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"}`}><Quote className="w-4 h-4" /></button>
          <button title="代码块" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-1.5 rounded-md transition-all duration-150 ${editor.isActive("codeBlock") ? "bg-cyan-100 text-cyan-700" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"}`}><Code2 className="w-4 h-4" /></button>
          <button title="分割线" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-all duration-150"><Minus className="w-4 h-4" /></button>
          <button title="清除格式" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-all duration-150"><Eraser className="w-4 h-4" /></button>

          <div className="w-px h-4 bg-zinc-200 mx-0.5" />

          <button title="撤销" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}
            className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"><Undo2 className="w-4 h-4" /></button>
          <button title="重做" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}
            className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"><Redo2 className="w-4 h-4" /></button>
      </div>

      {/* 编辑器内容 */}
      <EditorContent editor={editor} />

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      <PromptDialog open={linkOpen} onOpenChange={setLinkOpen} title="插入链接" placeholder="https://example.com" onConfirm={(url) => editor.chain().focus().setLink({ href: url }).run()} />
      <PromptDialog open={imageUrlOpen} onOpenChange={setImageUrlOpen} title="插入外链图片" placeholder="https://example.com/image.jpg" onConfirm={(url) => editor.chain().focus().setImage({ src: url }).run()} />
    </div>
  )
}
