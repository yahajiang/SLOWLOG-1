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
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-zinc-200 shadow-2xl rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-900">
              {lang === "zh" ? "嵌入视频" : "Embed Video"}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1.5">
              {lang === "zh" ? "视频链接" : "Video URL"}
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="YouTube / Vimeo / Bilibili"
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400"
              autoFocus
            />
          </div>
          <p className="text-[11px] text-zinc-400">
            {lang === "zh"
              ? "支持 YouTube、Vimeo、Bilibili 链接，自动解析为播放器。"
              : "Supports YouTube, Vimeo, Bilibili links. Auto-embeds as player."}
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-500 border border-zinc-200 rounded hover:bg-zinc-50"
            >
              {lang === "zh" ? "取消" : "Cancel"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!url.trim()}
              className="px-3 py-1.5 text-xs text-white bg-zinc-900 rounded hover:bg-zinc-700 disabled:opacity-40"
            >
              {lang === "zh" ? "插入" : "Insert"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
