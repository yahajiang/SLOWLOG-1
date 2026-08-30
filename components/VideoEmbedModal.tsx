"use client";

import { useState } from "react";
import { X, Video } from "lucide-react";
import { useLang } from "@/lib/lang-context";

interface VideoEmbedModalProps {
  onInsert: (url: string) => void;
  onClose: () => void;
}

export function VideoEmbedModal({ onInsert, onClose }: VideoEmbedModalProps) {
  const [url, setUrl] = useState("");
  const { lang } = useLang();

  const handleSubmit = () => {
    if (url.trim()) {
      onInsert(url.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[var(--yh-bg)] border border-[var(--yh-border)] shadow-lg rounded w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeIn 0.15s var(--ease-out) both" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--yh-border)]">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-[var(--yh-muted)]" />
            <span className="text-sm font-semibold text-[var(--yh-text)]">
              {lang === "zh" ? "嵌入视频" : "Embed Video"}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-[var(--yh-muted)] hover:text-[var(--yh-text)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[11px] text-[var(--yh-muted)] uppercase tracking-wider block mb-1.5">
              {lang === "zh" ? "视频链接" : "Video URL"}
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="YouTube / Vimeo / Bilibili"
              className="w-full px-3 py-2 text-sm border border-[var(--yh-border)] bg-white rounded focus:outline-none focus:border-[var(--yh-muted)] transition-colors"
              autoFocus
            />
          </div>
          <p className="text-[11px] text-[var(--yh-muted)]">
            {lang === "zh"
              ? "支持 YouTube、Vimeo、Bilibili 链接，自动解析为播放器。"
              : "Supports YouTube, Vimeo, Bilibili links. Auto-embeds as player."}
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-[var(--yh-muted)] border border-[var(--yh-border)] rounded hover:bg-[var(--yh-bg)] hover:text-[var(--yh-text)] transition-colors"
            >
              {lang === "zh" ? "取消" : "Cancel"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!url.trim()}
              className="px-4 py-1.5 text-xs text-white bg-zinc-900 rounded hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            >
              {lang === "zh" ? "插入" : "Insert"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
