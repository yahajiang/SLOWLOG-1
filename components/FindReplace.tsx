"use client";

import { useState, useCallback, useEffect } from "react";
import { Search, ChevronUp, ChevronDown, X } from "lucide-react";
import type { Editor } from "@tiptap/react";

interface FindReplaceProps {
  editor: Editor;
  onClose: () => void;
}

export function FindReplace({ editor, onClose }: FindReplaceProps) {
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [useRegex, setUseRegex] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);

  const findMatches = useCallback(() => {
    if (!query) {
      setMatchCount(0);
      setCurrentMatch(0);
      return;
    }
    const text = editor.getText();
    try {
      const regex = useRegex
        ? new RegExp(query, "gi")
        : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const matches = text.match(regex);
      setMatchCount(matches?.length || 0);
    } catch {
      setMatchCount(0);
    }
  }, [editor, query, useRegex]);

  useEffect(() => {
    findMatches();
  }, [findMatches]);

  const findNext = useCallback(() => {
    if (!query) return;
    const { state } = editor;
    const { doc } = state;
    const text = doc.textBetween(0, doc.content.size);
    try {
      const regex = useRegex
        ? new RegExp(query, "gi")
        : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const start = state.selection.to;
      const match = regex.exec(text.slice(start));
      if (match) {
        const from = start + match.index;
        const to = from + match[0].length;
        editor.chain().focus().setTextSelection({ from, to }).run();
        setCurrentMatch((prev) => Math.min(prev + 1, matchCount));
      } else {
        const match2 = regex.exec(text);
        if (match2) {
          editor.chain().focus().setTextSelection({ from: match2.index, to: match2.index + match2[0].length }).run();
          setCurrentMatch(1);
        }
      }
    } catch {}
  }, [editor, query, useRegex, matchCount]);

  const findPrev = useCallback(() => {
    if (!query) return;
    const { state } = editor;
    const text = state.doc.textBetween(0, state.doc.content.size);
    try {
      const regex = useRegex
        ? new RegExp(query, "gi")
        : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const end = state.selection.from;
      const slice = text.slice(0, end);
      let lastMatch: RegExpExecArray | null = null;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(slice)) !== null) {
        lastMatch = m;
      }
      if (lastMatch) {
        editor.chain().focus().setTextSelection({ from: lastMatch.index, to: lastMatch.index + lastMatch[0].length }).run();
        setCurrentMatch((prev) => Math.max(prev - 1, 1));
      }
    } catch {}
  }, [editor, query, useRegex]);

  const replaceCurrent = useCallback(() => {
    if (!query) return;
    const { state } = editor;
    const { from, to } = state.selection;
    const selected = state.doc.textBetween(from, to);
    try {
      const regex = useRegex
        ? new RegExp(query, "i")
        : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (regex.test(selected)) {
        editor.chain().focus().deleteSelection().insertContent(replacement).run();
      }
      findNext();
    } catch {}
  }, [editor, query, replacement, useRegex, findNext]);

  const replaceAll = useCallback(() => {
    if (!query) return;
    const { state } = editor;
    const text = state.doc.textBetween(0, state.doc.content.size);
    try {
      const regex = useRegex
        ? new RegExp(query, "gi")
        : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const newText = text.replace(regex, replacement);
      if (newText !== text) {
        editor.chain().focus().selectAll().insertContent(newText).run();
        setMatchCount(0);
        setCurrentMatch(0);
      }
    } catch {}
  }, [editor, query, replacement, useRegex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === "h") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="absolute top-full right-0 mt-1 bg-white border border-zinc-200 shadow-xl rounded-lg z-50 w-80">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">查找与替换</span>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xs">✕</button>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") findNext(); }}
            placeholder="查找..."
            className="flex-1 px-2 py-1.5 text-sm border border-zinc-200 rounded focus:outline-none focus:border-zinc-400"
            autoFocus
          />
          <span className="text-[10px] text-zinc-400 whitespace-nowrap">
            {matchCount > 0 ? `${currentMatch}/${matchCount}` : "无结果"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder="替换为..."
            className="flex-1 px-2 py-1.5 text-sm border border-zinc-200 rounded focus:outline-none focus:border-zinc-400"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <input
              type="checkbox"
              checked={useRegex}
              onChange={(e) => setUseRegex(e.target.checked)}
              className="rounded border-zinc-300"
            />
            正则表达式
          </label>
          <div className="flex items-center gap-1">
            <button onClick={findPrev} className="p-1 hover:bg-zinc-100 rounded" title="上一个">
              <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
            </button>
            <button onClick={findNext} className="p-1 hover:bg-zinc-100 rounded" title="下一个">
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            </button>
            <button onClick={replaceCurrent} className="px-2 py-1 text-[10px] text-zinc-600 hover:bg-zinc-100 rounded" title="替换当前">
              替换
            </button>
            <button onClick={replaceAll} className="px-2 py-1 text-[10px] text-zinc-600 hover:bg-zinc-100 rounded" title="全部替换">
              全部
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
