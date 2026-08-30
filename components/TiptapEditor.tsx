"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
}

// ============================================================
// Main Component
// ============================================================

export function TiptapEditor({
  initialMarkdown,
  onSave,
  onAutoSave,
  readOnly = false,
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
      Highlight,
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
      triggerAutoSave(editor);
      // Debounce preview update
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        const html = editor.getHTML();
        setPreviewHtml(html);
      }, 150);
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
  }, [editor, onSave]);

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
        t={t}
        lang={lang}
      />

      {/* Editor + Preview Split — 80/20 */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Editor (80%) */}
        <div className="w-[80%] min-w-0 flex flex-col border-r border-zinc-200 overflow-hidden">
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="max-w-3xl mx-auto px-8 py-10">
              <EditorContent
                editor={editor}
                className="tiptap-editor"
              />
            </div>
          </div>
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
  t: ReturnType<typeof useLang>["t"];
  lang: string;
}) {
  const [showTableMenu, setShowTableMenu] = useState(false);

  if (!editor) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="shrink-0 border-b border-zinc-200 bg-zinc-50/80 px-3 py-2 flex items-center gap-1 overflow-x-auto">
      {/* Heading */}
      <ToolbarGroup>
        <ToolbarSelect
          value={
            editor.isActive("heading", { level: 1 })
              ? "h1"
              : editor.isActive("heading", { level: 2 })
                ? "h2"
                : editor.isActive("heading", { level: 3 })
                  ? "h3"
                  : "p"
          }
          onChange={(val) => {
            if (val === "p") {
              editor.chain().focus().setParagraph().run();
            } else {
              const level = parseInt(val.replace("h", "")) as 1 | 2 | 3 | 4;
              editor.chain().focus().toggleHeading({ level }).run();
            }
          }}
          options={[
            { value: "p", label: lang === "zh" ? "正文" : "Text" },
            { value: "h1", label: "H1" },
            { value: "h2", label: "H2" },
            { value: "h3", label: "H3" },
            { value: "h4", label: "H4" },
          ]}
        />
      </ToolbarGroup>

      <ToolbarDivider />

      {/* Inline formatting */}
      <ToolbarGroup>
        <ToolbarButton
          icon={<strong>B</strong>}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        />
        <ToolbarButton
          icon={<em>I</em>}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        />
        <ToolbarButton
          icon={<span className="underline">U</span>}
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
        />
        <ToolbarButton
          icon={<span className="line-through">S</span>}
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        />
        <ToolbarButton
          icon={<span className="bg-yellow-200 px-1">H</span>}
          active={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          title="Highlight"
        />
        <ToolbarButton
          icon={<span className="font-mono text-xs">{'<>'}</span>}
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline Code"
        />
      </ToolbarGroup>

      <ToolbarDivider />

      {/* Block formatting */}
      <ToolbarGroup>
        <ToolbarButton
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 3v18M18 3v18M3 12h18" />
            </svg>
          }
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
        />
        <ToolbarButton
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
          }
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        />
        <ToolbarButton
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 6h11M10 12h11M10 18h11M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          }
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered List"
        />
        <ToolbarButton
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          }
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          title="Task List"
        />
        <ToolbarButton
          icon={<span className="font-mono text-[10px] bg-zinc-200 px-1.5 py-0.5">---</span>}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        />
      </ToolbarGroup>

      <ToolbarDivider />

      {/* Code Block */}
      <ToolbarGroup>
        <ToolbarButton
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          }
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        />
      </ToolbarGroup>

      <ToolbarDivider />

      {/* Table */}
      <ToolbarGroup className="relative">
        <ToolbarButton
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
            </svg>
          }
          onClick={() => setShowTableMenu(!showTableMenu)}
          title="Insert Table"
        />
        {showTableMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 shadow-lg p-3 z-50 rounded">
            <p className="text-[10px] text-zinc-400 mb-2 uppercase tracking-wider">
              {lang === "zh" ? "选择表格大小" : "Table size"}
            </p>
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 5 }, (_, r) =>
                Array.from({ length: 5 }, (_, c) => (
                  <button
                    key={`${r}-${c}`}
                    className="w-6 h-6 border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-100 transition-colors"
                    style={{
                      background:
                        r <= 1 && c <= 1
                          ? "var(--yh-accent)"
                          : undefined,
                    }}
                    onClick={() => {
                      onInsertTable(r + 2, c + 2);
                      setShowTableMenu(false);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </ToolbarGroup>

      {/* Image */}
      <ToolbarGroup>
        <ToolbarButton
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          }
          onClick={() => fileInputRef.current?.click()}
          title={lang === "zh" ? "插入图片（支持拖拽/粘贴/点击选择）" : "Insert image (drag/paste/click)"}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImageUpload(file);
            e.target.value = "";
          }}
        />
      </ToolbarGroup>

      <ToolbarDivider />

      {/* Link */}
      <ToolbarGroup>
        <ToolbarButton
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
          }
          active={editor.isActive("link")}
          onClick={() => {
            const url = prompt("URL:");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          title="Insert Link"
        />
      </ToolbarGroup>

      {/* Text Alignment */}
      <ToolbarDivider />
      <ToolbarGroup>
        {[
          { align: "left", icon: "≡" },
          { align: "center", icon: "≡" },
          { align: "right", icon: "≡" },
        ].map(({ align, icon }) => (
          <ToolbarButton
            key={align}
            icon={
              <span
                className={`text-xs ${align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"}`}
                style={{ display: "block", width: "16px" }}
              >
                {icon}
              </span>
            }
            active={editor.isActive({ textAlign: align })}
            onClick={() =>
              editor.chain().focus().setTextAlign(align).run()
            }
            title={`Align ${align}`}
          />
        ))}
      </ToolbarGroup>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side */}
      <ToolbarGroup>
        <ToolbarButton
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h10M4 18h14" />
            </svg>
          }
          active={showOutline}
          onClick={onToggleOutline}
          title={lang === "zh" ? "切换大纲" : "Toggle outline"}
        />
        <ToolbarButton
          icon={
            isFullscreen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 00-2 2v3m18-5h-3m3 0v3m0 12v-3m0 3h-3M3 16v3a2 2 0 002 2h3" />
              </svg>
            )
          }
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen (F11)" : "Fullscreen (F11)"}
        />
        <button
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-zinc-900 text-white text-[11px] tracking-widest uppercase hover:bg-zinc-700 disabled:opacity-60 transition-colors"
        >
          {isSaving ? t.saving : t.save}
        </button>
      </ToolbarGroup>
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
}: {
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
        active
          ? "bg-zinc-900 text-white"
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

import { memo } from "react";

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
