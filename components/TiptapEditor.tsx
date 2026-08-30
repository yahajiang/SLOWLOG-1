"use client";

import { useEffect, useState, useCallback, useRef, useMemo, memo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Typography from "@tiptap/extension-typography";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { markdownToTiptapJson, tiptapJsonToMarkdown } from "@/lib/tiptap-utils";
import { useLang } from "@/lib/lang-context";
import { IframeEmbed } from "@/lib/tiptap-extensions/IframeEmbed";
import { FloatingToolbar } from "./FloatingToolbar";
import { SpecialCharPicker } from "./SpecialCharPicker";
import { FindReplace } from "./FindReplace";
import { SourceEditor } from "./SourceEditor";
import { VersionHistory } from "./VersionHistory";
import { VideoEmbedModal } from "./VideoEmbedModal";

const lowlight = createLowlight(common);

// ============================================================
// Types
// ============================================================

interface OutlineItem {
  id: string;
  text: string;
  level: number;
}

interface TiptapEditorProps {
  initialMarkdown: string;
  onSave: (markdown: string) => void;
  onAutoSave?: (markdown: string) => void;
  readOnly?: boolean;
  postId?: string;
  postTitle?: string;
}

// ============================================================
// Main Component
// ============================================================

export function TiptapEditor({
  initialMarkdown,
  onSave,
  onAutoSave,
  readOnly = false,
  postId,
  postTitle,
}: TiptapEditorProps) {
  const { t, lang } = useLang();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [readTime, setReadTime] = useState("");
  const [showOutline, setShowOutline] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const [showSourceEditor, setShowSourceEditor] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showSpecialChars, setShowSpecialChars] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  // ============================================================
  // Editor Instance
  // ============================================================

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Use lowlight version
      }),
      Placeholder.configure({
        placeholder: lang === "zh" ? "开始写作..." : "Start writing...",
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "tiptap-table",
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "tiptap-link",
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Typography,
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      IframeEmbed,
    ],
    content: markdownToTiptapJson(initialMarkdown),
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: "tiptap-editor-content focus:outline-none",
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          event.preventDefault();
          const files = Array.from(event.dataTransfer.files);
          const imageFiles = files.filter((f) => f.type.startsWith("image/"));
          for (const file of imageFiles) {
            handleImageUpload(file);
          }
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) handleImageUpload(file);
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      updateStats(editor);
      updateOutline(editor);
      const html = editor.getHTML();
      setPreviewHtml(html);
      triggerAutoSave(editor);
    },
    onCreate: ({ editor }) => {
      updateStats(editor);
      updateOutline(editor);
      // Set initial preview
      const html = editor.getHTML();
      setPreviewHtml(html);
    },
  });

  // ============================================================
  // Stats & Outline
  // ============================================================

  const updateStats = useCallback(
    (ed: ReturnType<typeof useEditor> extends infer T ? T : never) => {
      if (!ed) return;
      const text = ed.getText();
      const chars = text.length;
      const words = text
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;
      setCharCount(chars);
      setWordCount(words);

      const minutes = Math.max(1, Math.ceil(words / 200));
      setReadTime(`${minutes} ${t.minRead}`);
    },
    [t.minRead]
  );

  const updateOutline = useCallback(
    (ed: ReturnType<typeof useEditor> extends infer T ? T : never) => {
      if (!ed) return;
      const items: OutlineItem[] = [];
      const doc = ed.state.doc;

      doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          const id = `heading-${pos}`;
          items.push({
            id,
            text: node.textContent,
            level: node.attrs.level as number,
          });
        }
      });

      setOutline(items);
    },
    []
  );

  // ============================================================
  // Auto-save
  // ============================================================

  const triggerAutoSave = useCallback(
    (ed: ReturnType<typeof useEditor> extends infer T ? T : never) => {
      if (!ed || !onAutoSave) return;
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        const md = tiptapJsonToMarkdown(
          ed.getJSON() as Record<string, unknown>
        );
        onAutoSave(md);
        setLastSaved(new Date());
      }, 2000);
    },
    [onAutoSave]
  );

  // ============================================================
  // Image Upload
  // ============================================================

  const handleImageUpload = useCallback(
    (file: File) => {
      if (!editor) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result as string;
        editor.chain().focus().setImage({ src, alt: file.name }).run();
      };
      reader.readAsDataURL(file);
    },
    [editor]
  );

  // ============================================================
  // Save Handler
  // ============================================================

  const handleSave = useCallback(() => {
    if (!editor) return;
    setIsSaving(true);
    const md = tiptapJsonToMarkdown(
      editor.getJSON() as Record<string, unknown>
    );
    onSave(md);
    setLastSaved(new Date());
    setTimeout(() => setIsSaving(false), 500);

    if (postId) {
      fetch("/api/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ postId, title: postTitle || "", markdown: md }),
      }).catch(() => {});
    }
  }, [editor, onSave, postId, postTitle]);

  const handleRestoreVersion = useCallback((markdown: string) => {
    if (!editor) return;
    const json = markdownToTiptapJson(markdown);
    editor.commands.setContent(json);
  }, [editor]);

  // ============================================================
  // Keyboard Shortcuts
  // ============================================================

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "F11") {
        e.preventDefault();
        setIsFullscreen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  // ============================================================
  // Cleanup
  // ============================================================

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  // ============================================================
  // Outline click handler
  // ============================================================

  const scrollToHeading = useCallback(
    (id: string) => {
      if (!editor) return;
      const pos = parseInt(id.replace("heading-", ""));
      editor.commands.focus("start");
      editor.commands.setTextSelection(pos);
      // Scroll into view
      const { view } = editor;
      const resolvedPos = view.state.doc.resolve(pos);
      const node = view.nodeDOM(resolvedPos.before(1));
      if (node instanceof HTMLElement) {
        node.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [editor]
  );

  // ============================================================
  // Table helper
  // ============================================================

  const insertTable = useCallback(
    (rows: number, cols: number) => {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .insertTable({ rows, cols, withHeaderRow: true })
        .run();
    },
    [editor]
  );

  // ============================================================
  // Render
  // ============================================================

  if (!editor) return null;

  return (
    <div
      className={`flex flex-col bg-white h-full ${
        isFullscreen
          ? "fixed inset-0 z-50"
          : "border border-zinc-200"
      }`}
      ref={editorContainerRef}
    >
      {/* Toolbar */}
      <Toolbar
        editor={editor}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        onSave={handleSave}
        isSaving={isSaving}
        lastSaved={lastSaved}
        wordCount={wordCount}
        charCount={charCount}
        readTime={readTime}
        showOutline={showOutline}
        onToggleOutline={() => setShowOutline(!showOutline)}
        onInsertTable={insertTable}
        onImageUpload={handleImageUpload}
        onToggleSource={() => setShowSourceEditor(!showSourceEditor)}
        showSourceEditor={showSourceEditor}
        onToggleFindReplace={() => setShowFindReplace(!showFindReplace)}
        showFindReplace={showFindReplace}
        onToggleSpecialChars={() => setShowSpecialChars(!showSpecialChars)}
        showSpecialChars={showSpecialChars}
        onToggleVersionHistory={() => setShowVersionHistory(!showVersionHistory)}
        showVersionHistory={showVersionHistory}
        showMoreTools={showMoreTools}
        onToggleMoreTools={() => setShowMoreTools(!showMoreTools)}
        postId={postId}
        onRestoreVersion={handleRestoreVersion}
        t={t}
        lang={lang}
      />

      {/* Editor + Preview Split — 80/20 */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Editor (80%) */}
        <div className="w-[80%] min-w-0 flex flex-col border-r border-zinc-200 overflow-hidden relative">
          {showSourceEditor ? (
            <SourceEditor editor={editor} onToggle={() => setShowSourceEditor(false)} />
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0 relative">
              {editor && <FloatingToolbar editor={editor} />}
              <div className="max-w-3xl mx-auto px-8 py-10">
                <EditorContent
                  editor={editor}
                  className="tiptap-editor"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Preview (20%) */}
        <div className="w-[20%] min-w-0 flex flex-col bg-zinc-50/30 overflow-hidden">
          <div className="shrink-0 px-3 py-2 border-b border-zinc-100 bg-white/80 flex items-center justify-between">
            <span className="text-[10px] font-medium tracking-widest uppercase text-zinc-400">
              {t.preview}
            </span>
            <span className="text-[10px] text-zinc-400">
              {lang === "zh" ? "实时" : "Live"}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="px-4 py-6">
              <div
                className="prose prose-zinc prose-sm max-w-none
                  prose-p:text-[13px] prose-p:leading-[1.7] prose-p:text-[var(--yh-text)]/85 prose-p:mb-4
                  prose-h2:text-base prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-2
                  prose-a:text-[var(--yh-accent)] prose-a:underline prose-a:underline-offset-2
                  prose-code:text-[11px] prose-code:bg-zinc-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono
                  prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-pre:p-3 prose-pre:rounded prose-pre:text-[11px] prose-pre:overflow-x-auto
                  prose-blockquote:border-l-2 prose-blockquote:border-[var(--yh-border)] prose-blockquote:pl-3 prose-blockquote:text-zinc-600 prose-blockquote:text-[13px] prose-blockquote:italic
                  prose-ul:list-disc prose-ul:pl-5 prose-ul:text-[13px] prose-ol:list-decimal prose-ol:pl-5 prose-ol:text-[13px]
                  prose-hr:border-[var(--yh-border)]
                  prose-img:rounded prose-img:my-4 prose-img:max-w-full
                  prose-table:text-[12px] prose-table:border-collapse prose-table:w-full prose-th:border prose-th:border-zinc-200 prose-th:bg-zinc-50 prose-th:px-2 prose-th:py-1.5 prose-th:text-left prose-th:font-semibold prose-td:border prose-td:border-zinc-200 prose-td:px-2 prose-td:py-1.5"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
              {!previewHtml && (
                <p className="text-sm text-zinc-400 italic">
                  {lang === "zh" ? "开始写作后，右侧将实时显示预览效果..." : "Start writing to see live preview..."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        wordCount={wordCount}
        charCount={charCount}
        readTime={readTime}
        lastSaved={lastSaved}
        t={t}
      />
    </div>
  );
}

// ============================================================
// Toolbar Component
// ============================================================

const Toolbar = memo(function Toolbar({
  editor,
  isFullscreen,
  onToggleFullscreen,
  onSave,
  isSaving,
  lastSaved,
  wordCount,
  charCount,
  readTime,
  showOutline,
  onToggleOutline,
  onInsertTable,
  onImageUpload,
  onToggleSource,
  showSourceEditor,
  onToggleFindReplace,
  showFindReplace,
  onToggleSpecialChars,
  showSpecialChars,
  onToggleVersionHistory,
  showVersionHistory,
  showMoreTools,
  onToggleMoreTools,
  postId,
  onRestoreVersion,
  t,
  lang,
}: {
  editor: ReturnType<typeof useEditor>;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onSave: () => void;
  isSaving: boolean;
  lastSaved: Date | null;
  wordCount: number;
  charCount: number;
  readTime: string;
  showOutline: boolean;
  onToggleOutline: () => void;
  onInsertTable: (rows: number, cols: number) => void;
  onImageUpload: (file: File) => void;
  onToggleSource: () => void;
  showSourceEditor: boolean;
  onToggleFindReplace: () => void;
  showFindReplace: boolean;
  onToggleSpecialChars: () => void;
  showSpecialChars: boolean;
  onToggleVersionHistory: () => void;
  showVersionHistory: boolean;
  showMoreTools: boolean;
  onToggleMoreTools: () => void;
  postId?: string;
  onRestoreVersion: (markdown: string) => void;
  t: ReturnType<typeof useLang>["t"];
  lang: string;
}) {
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showMoreInsert, setShowMoreInsert] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const PRESET_COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
    "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280", "#000000",
  ];
  const HIGHLIGHT_COLORS = [
    { color: "#fef08a", label: "Yellow" },
    { color: "#bbf7d0", label: "Green" },
    { color: "#bfdbfe", label: "Blue" },
    { color: "#fbcfe8", label: "Pink" },
    { color: "#e9d5ff", label: "Purple" },
    { color: "#fed7aa", label: "Orange" },
  ];

  if (!editor) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="shrink-0 sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/80 overflow-visible">
      <div className="px-3 py-2 flex items-center gap-1 flex-wrap">
        {/* === 基础格式组（始终展开） === */}
        <ToolbarGroup>
          <ToolbarButton
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="撤销 Ctrl+Z"
          />
          <ToolbarButton
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H13"/></svg>}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="重做 Ctrl+Y"
          />
        </ToolbarGroup>

        <ToolbarDivider />

        <ToolbarGroup>
          <ToolbarSelect
            value={
              editor.isActive("heading", { level: 1 }) ? "h1" :
              editor.isActive("heading", { level: 2 }) ? "h2" :
              editor.isActive("heading", { level: 3 }) ? "h3" : "p"
            }
            onChange={(val) => {
              if (val === "p") editor.chain().focus().setParagraph().run();
              else editor.chain().focus().toggleHeading({ level: parseInt(val.replace("h", "")) as 1 | 2 | 3 }).run();
            }}
            options={[
              { value: "p", label: lang === "zh" ? "正文" : "Text" },
              { value: "h1", label: "H1" }, { value: "h2", label: "H2" }, { value: "h3", label: "H3" },
            ]}
          />
        </ToolbarGroup>

        <ToolbarDivider />

        {/* === 文本格式组 === */}
        <ToolbarGroup>
          <ToolbarButton icon={<strong>B</strong>} active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="加粗" />
          <ToolbarButton icon={<em>I</em>} active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="斜体" />
          <ToolbarButton icon={<span className="underline">U</span>} active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="下划线" />
          <ToolbarButton icon={<span className="line-through">S</span>} active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="删除线" />
          <ToolbarButton icon={<span className="bg-yellow-200 px-1 rounded">H</span>} active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()} title="高亮" />
          <ToolbarButton icon={<span className="font-mono text-[10px]">{'<>'}</span>} active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} title="行内代码" />
        </ToolbarGroup>

        <ToolbarDivider />

        {/* === 颜色组 === */}
        <ToolbarGroup>
          <div className="relative" ref={colorPickerRef}>
            <ToolbarButton
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20h16M6 16l4-10h4l4 10"/><circle cx="12" cy="8" r="2" fill="currentColor"/></svg>}
              active={showColorPicker}
              onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); }}
              title="文字颜色"
            />
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 shadow-lg p-2 z-50 rounded">
                <p className="text-[10px] text-zinc-400 mb-2 uppercase tracking-wider">文字颜色</p>
                <div className="flex gap-1 mb-2">
                  {PRESET_COLORS.map((color) => (
                    <button key={color} className="w-6 h-6 rounded border border-zinc-200 hover:scale-110 transition-transform" style={{ backgroundColor: color }} onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false); }} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" defaultValue="#000000" className="w-6 h-6 cursor-pointer border-0 p-0" onChange={(e) => { editor.chain().focus().setColor(e.target.value).run(); setShowColorPicker(false); }} />
                  <button className="text-[10px] text-zinc-500 hover:text-zinc-700 ml-auto" onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }}>重置</button>
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <ToolbarButton
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>}
              active={showHighlightPicker}
              onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); }}
              title="高亮颜色"
            />
            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 shadow-lg p-2 z-50 rounded">
                <p className="text-[10px] text-zinc-400 mb-2 uppercase tracking-wider">高亮颜色</p>
                <div className="flex gap-1">
                  {HIGHLIGHT_COLORS.map(({ color, label }) => (
                    <button key={color} className="w-6 h-6 rounded border border-zinc-200 hover:scale-110 transition-transform" style={{ backgroundColor: color }} title={label} onClick={() => { editor.chain().focus().toggleHighlight({ color }).run(); setShowHighlightPicker(false); }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* === 块级格式组 === */}
        <ToolbarGroup>
          <ToolbarButton
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3v18M18 3v18M3 12h18"/></svg>}
            active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="引用" />
          <ToolbarButton
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h10"/></svg>}
            active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="无序列表" />
          <ToolbarButton
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 6h11M10 12h11M10 18h11M3 6h.01M3 12h.01M3 18h.01"/></svg>}
            active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="有序列表" />
          <ToolbarButton
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}
            active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()} title="任务列表" />
        </ToolbarGroup>

        <ToolbarDivider />

        {/* === 缩进 === */}
        <ToolbarGroup>
          <ToolbarButton
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 6h10M11 12h10M11 18h10M3 3l4 4-4 4"/><path d="M3 15h4"/></svg>}
            onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
            title="增加缩进" />
          <ToolbarButton
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 6h10M11 12h10M11 18h10"/><path d="M3 3l4 4-4 4"/><path d="M3 15h4"/></svg>}
            onClick={() => editor.chain().focus().liftListItem("listItem").run()}
            title="减少缩进" />
        </ToolbarGroup>

        <ToolbarDivider />

        {/* === 插入组（折叠） === */}
        <div className="relative">
          <ToolbarButton
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>}
            active={showMoreInsert}
            onClick={() => setShowMoreInsert(!showMoreInsert)}
            title="插入"
          />
          {showMoreInsert && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 shadow-lg p-2 z-50 rounded min-w-[180px]">
              <button className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-left hover:bg-zinc-100 rounded" onClick={() => { onInsertTable(3, 3); setShowMoreInsert(false); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
                表格
              </button>
              <button className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-left hover:bg-zinc-100 rounded" onClick={() => { fileInputRef.current?.click(); setShowMoreInsert(false); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                图片
              </button>
              <button className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-left hover:bg-zinc-100 rounded" onClick={() => { setShowVideoModal(true); setShowMoreInsert(false); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                视频
              </button>
              <button className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-left hover:bg-zinc-100 rounded" onClick={() => {
                const url = prompt("输入链接地址:");
                if (url) editor.chain().focus().setLink({ href: url }).run();
                setShowMoreInsert(false);
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                链接
              </button>
              <div className="border-t border-zinc-100 my-1" />
              <button className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-left hover:bg-zinc-100 rounded" onClick={() => { editor.chain().focus().setHorizontalRule().run(); setShowMoreInsert(false); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="2" y1="12" x2="22" y2="12"/></svg>
                分割线
              </button>
            </div>
          )}
        </div>

        <ToolbarDivider />

        {/* === 高级功能（折叠到更多菜单） === */}
        <div className="relative">
          <ToolbarButton
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>}
            active={showMoreTools}
            onClick={onToggleMoreTools}
            title="更多工具"
          />
          {showMoreTools && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-zinc-200 shadow-lg p-2 z-50 rounded min-w-[200px]">
              <button className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm text-left hover:bg-zinc-100 rounded ${showSourceEditor ? "bg-zinc-100" : ""}`} onClick={() => { onToggleSource(); onToggleMoreTools(); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                源码编辑
              </button>
              <button className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm text-left hover:bg-zinc-100 rounded ${showFindReplace ? "bg-zinc-100" : ""}`} onClick={() => { onToggleFindReplace(); onToggleMoreTools(); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                查找与替换
              </button>
              <button className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm text-left hover:bg-zinc-100 rounded ${showSpecialChars ? "bg-zinc-100" : ""}`} onClick={() => { onToggleSpecialChars(); onToggleMoreTools(); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                特殊字符
              </button>
              {postId && (
                <button className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm text-left hover:bg-zinc-100 rounded ${showVersionHistory ? "bg-zinc-100" : ""}`} onClick={() => { onToggleVersionHistory(); onToggleMoreTools(); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  版本历史
                </button>
              )}
              <div className="border-t border-zinc-100 my-1" />
              <button className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-left hover:bg-zinc-100 rounded" onClick={() => editor.chain().focus().unsetAllMarks().run()}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4l16 16M20 4L4 20"/></svg>
                清除格式
              </button>
            </div>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) onImageUpload(file); e.target.value = ""; }} />

        {/* === 弹出层 === */}
        {showSpecialChars && (
          <div className="relative">
            <SpecialCharPicker
              onInsert={(char) => editor.chain().focus().insertContent(char).run()}
              onClose={onToggleSpecialChars}
            />
          </div>
        )}
        {showFindReplace && (
          <div className="relative">
            <FindReplace editor={editor} onClose={onToggleFindReplace} />
          </div>
        )}
        {showVersionHistory && postId && (
          <div className="relative">
            <VersionHistory postId={postId} onRestore={onRestoreVersion} onClose={onToggleVersionHistory} />
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* === 右侧固定按钮 === */}
        <ToolbarGroup>
          <ToolbarButton
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h10M4 18h14"/></svg>}
            active={showOutline} onClick={onToggleOutline} title="切换大纲" />
          <ToolbarButton
            icon={isFullscreen ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18-5h-3m3 0v3m0 12v-3m0 3h-3M3 16v3a2 2 0 002 2h3"/></svg>
            )}
            onClick={onToggleFullscreen} title={isFullscreen ? "退出全屏" : "全屏"} />
          <button onClick={onSave} disabled={isSaving} className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-zinc-900 text-white text-[11px] tracking-widest uppercase hover:bg-zinc-700 disabled:opacity-60 transition-colors">
            {isSaving ? t.saving : t.save}
          </button>
        </ToolbarGroup>
      </div>
      {showVideoModal && (
        <VideoEmbedModal
          onInsert={(url) => {
            const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
            const biliMatch = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
            let embedUrl = url;
            if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
            else if (vimeoMatch) embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
            else if (biliMatch) embedUrl = `https://player.bilibili.com/player.html?bvid=${biliMatch[1]}&high_quality=1`;
            editor.chain().focus().setIframe({ src: embedUrl }).run();
          }}
          onClose={() => setShowVideoModal(false)}
        />
      )}
    </div>
  );
});

// ============================================================
// Toolbar Sub-components
// ============================================================

function ToolbarGroup({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex items-center gap-0.5 ${className}`}>{children}</div>;
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-zinc-200 mx-1" />;
}

function ToolbarButton({
  icon,
  active,
  onClick,
  title,
  disabled,
}: {
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
        active
          ? "bg-zinc-900 text-white"
          : disabled
            ? "text-zinc-300 cursor-not-allowed"
            : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
      }`}
    >
      {icon}
    </button>
  );
}

function ToolbarSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 px-2 text-[11px] border border-zinc-200 bg-white text-zinc-700 focus:outline-none focus:border-zinc-400 cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ============================================================
// Status Bar
// ============================================================

const StatusBar = memo(function StatusBar({
  wordCount,
  charCount,
  readTime,
  lastSaved,
  t,
}: {
  wordCount: number;
  charCount: number;
  readTime: string;
  lastSaved: Date | null;
  t: ReturnType<typeof useLang>["t"];
}) {
  const { lang } = useLang();
  const savedText = useMemo(() => {
    if (!lastSaved) return "";
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
    if (diff < 5) return lang === "zh" ? "刚刚保存" : "Just saved";
    if (diff < 60) return `${diff}s`;
    return `${Math.floor(diff / 60)}m`;
  }, [lastSaved, lang]);

  return (
    <div className="shrink-0 border-t border-zinc-200 bg-zinc-50 px-4 py-1.5 flex items-center justify-between text-[10px] text-zinc-400">
      <div className="flex items-center gap-4">
        <span>
          {lang === "zh" ? "字数" : "Words"}: {wordCount.toLocaleString()}
        </span>
        <span>
          {lang === "zh" ? "字符" : "Chars"}: {charCount.toLocaleString()}
        </span>
        <span>{readTime}</span>
      </div>
      <div className="flex items-center gap-3">
        {lastSaved && (
          <span className="text-zinc-400">
            {lang === "zh" ? "已保存" : "Saved"} {savedText}
          </span>
        )}
      </div>
    </div>
  );
});
