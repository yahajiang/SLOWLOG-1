"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Editor } from "@tiptap/react";

interface FloatingToolbarProps {
  editor: Editor;
}

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#000000",
];

const FONT_SIZES = [
  { label: "小", value: "13px" },
  { label: "正常", value: "16px" },
  { label: "大", value: "20px" },
  { label: "标题", value: "28px" },
];

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [showColors, setShowColors] = useState(false);
  const [showSizes, setShowSizes] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const { state } = editor;
    const { from, to } = state.selection;
    if (from === to) {
      setVisible(false);
      return;
    }

    const { view } = editor;
    const start = view.coordsAtPos(from);
    const end = view.coordsAtPos(to);

    const editorEl = view.dom.closest(".tiptap-editor");
    if (!editorEl) return;
    const editorRect = editorEl.getBoundingClientRect();

    const top = start.top - editorRect.top - 48;
    const left = (start.left + end.left) / 2 - editorRect.left;

    setPosition({ top: Math.max(0, top), left: Math.max(0, left) });
    setVisible(true);
  }, [editor]);

  useEffect(() => {
    editor.on("selectionUpdate", updatePosition);
    editor.on("blur", () => setVisible(false));
    return () => {
      editor.off("selectionUpdate", updatePosition);
      editor.off("blur", () => setVisible(false));
    };
  }, [editor, updatePosition]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowColors(false);
        setShowSizes(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!visible) return null;

  const btnClass = "w-7 h-7 flex items-center justify-center rounded text-xs transition-colors";
  const activeClass = "bg-zinc-900 text-white";
  const inactiveClass = "text-zinc-600 hover:bg-zinc-100";

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50 bg-white border border-zinc-200 shadow-xl rounded-lg px-1.5 py-1 flex items-center gap-0.5"
      style={{ top: position.top, left: position.left, transform: "translateX(-50%)" }}
    >
      <div className="relative">
        <button
          onClick={() => { setShowSizes(!showSizes); setShowColors(false); }}
          className={`${btnClass} ${inactiveClass} px-1.5 text-[10px] font-medium`}
          title="字号"
        >
          Aa
        </button>
        {showSizes && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 shadow-lg rounded p-1 z-50">
            {FONT_SIZES.map((size) => (
              <button
                key={size.value}
                onClick={() => {
                  editor.chain().focus().setMark("textStyle", { fontSize: size.value }).run();
                  setShowSizes(false);
                }}
                className="block w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 rounded"
              >
                {size.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${btnClass} ${editor.isActive("bold") ? activeClass : inactiveClass}`}
        title="加粗"
      >
        <strong>B</strong>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${btnClass} ${editor.isActive("italic") ? activeClass : inactiveClass}`}
        title="斜体"
      >
        <em>I</em>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`${btnClass} ${editor.isActive("underline") ? activeClass : inactiveClass}`}
        title="下划线"
      >
        <span className="underline">U</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`${btnClass} ${editor.isActive("strike") ? activeClass : inactiveClass}`}
        title="删除线"
      >
        <span className="line-through">S</span>
      </button>

      <div className="w-px h-4 bg-zinc-200 mx-0.5" />

      <div className="relative">
        <button
          onClick={() => { setShowColors(!showColors); setShowSizes(false); }}
          className={`${btnClass} ${inactiveClass}`}
          title="颜色"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 20h16M6 16l4-10h4l4 10" />
          </svg>
        </button>
        {showColors && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 shadow-lg rounded p-2 z-50">
            <div className="flex gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className="w-5 h-5 rounded border border-zinc-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    editor.chain().focus().setColor(color).run();
                    setShowColors(false);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()}
        className={`${btnClass} ${editor.isActive("highlight") ? activeClass : inactiveClass}`}
        title="高亮"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
        </svg>
      </button>
    </div>
  );
}
