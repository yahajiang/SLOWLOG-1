"use client";

import { useState, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { tiptapJsonToMarkdown, markdownToTiptapJson } from "@/lib/tiptap-utils";
import { useLang } from "@/lib/lang-context";

interface SourceEditorProps {
  editor: Editor;
  onToggle: () => void;
}

export function SourceEditor({ editor, onToggle }: SourceEditorProps) {
  const [markdown, setMarkdown] = useState(() => {
    return tiptapJsonToMarkdown(editor.getJSON() as Record<string, unknown>);
  });
  const { t } = useLang();

  const handleApply = useCallback(() => {
    try {
      const json = markdownToTiptapJson(markdown);
      editor.commands.setContent(json);
      onToggle();
    } catch (e) {
      console.error("Failed to parse markdown:", e);
    }
  }, [editor, markdown, onToggle]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 bg-zinc-50/80">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{t.sourceEditor}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className="px-3 py-1 text-[11px] text-zinc-500 hover:text-zinc-700 border border-zinc-200 rounded hover:bg-zinc-50"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleApply}
            className="px-3 py-1 text-[11px] text-white bg-zinc-900 hover:bg-zinc-700 rounded"
          >
            {t.apply}
          </button>
        </div>
      </div>
      <textarea
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
        className="flex-1 p-4 font-mono text-sm leading-relaxed resize-none focus:outline-none"
        spellCheck={false}
      />
    </div>
  );
}
