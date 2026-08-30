"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, RotateCcw, Trash2 } from "lucide-react";

interface Version {
  id: string;
  postId: string;
  title: string;
  markdown: string;
  createdAt: string;
}

interface VersionHistoryProps {
  postId: string;
  onRestore: (markdown: string) => void;
  onClose: () => void;
}

export function VersionHistory({ postId, onRestore, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/versions?postId=${postId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setVersions(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleRestore = useCallback((version: Version) => {
    if (confirm("确定恢复到此版本？当前内容将被替换。")) {
      onRestore(version.markdown);
      onClose();
    }
  }, [onRestore, onClose]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("确定删除此版本？")) return;
    try {
      await fetch(`/api/versions/${id}`, { method: "DELETE", credentials: "include" });
      fetchVersions();
    } catch (e) {
      console.error(e);
    }
  }, [fetchVersions]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "刚刚";
    if (diffMin < 60) return `${diffMin} 分钟前`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} 小时前`;
    return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="absolute top-full right-0 mt-1 bg-white border border-zinc-200 shadow-xl rounded-lg z-50 w-72">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">版本历史</span>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xs">✕</button>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-zinc-400">加载中...</div>
        ) : versions.length === 0 ? (
          <div className="p-4 text-center text-sm text-zinc-400">暂无版本记录</div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {versions.map((v) => (
              <div key={v.id} className="px-3 py-2.5 hover:bg-zinc-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-700 font-medium truncate">{v.title || "无标题"}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{formatTime(v.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => handleRestore(v)}
                      className="p-1 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="恢复此版本"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1">{v.markdown.slice(0, 80)}...</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="px-3 py-2 border-t border-zinc-100">
        <p className="text-[10px] text-zinc-400">最多保留 4 个版本</p>
      </div>
    </div>
  );
}
