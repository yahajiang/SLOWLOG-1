"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ListItemSkeleton } from "@/components/dashboard/Skeleton";

/** 移动端文章管理：搜索/状态筛选/上下架/删除/复制链接（编辑走桌面版） */
export default function MobilePostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [delId, setDelId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status !== "all") params.set("status", status);
    const res = await fetch(`/api/posts?${params}`);
    const data = await res.json();
    setPosts(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [q, status]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(t);
  }, [load]);

  const confirmDel = useCallback(async () => {
    if (!delId) return;
    const r = await fetch(`/api/posts/${delId}`, { method: "DELETE" });
    if (r.ok) toast("已删除", "success");
    else toast("删除失败", "error");
    setDelId(null);
    await load();
  }, [delId, toast, load]);

  const togglePublish = useCallback(
    async (p: any) => {
      const ns = p.status === "published" ? "draft" : "published";
      const r = await fetch(`/api/posts/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: ns }),
      });
      if (r.ok) toast(ns === "published" ? "已发布" : "已下架为草稿", "success");
      else toast("操作失败", "error");
      await load();
    },
    [toast, load]
  );

  const copyLink = useCallback(
    async (id: string) => {
      await navigator.clipboard.writeText(`${location.origin}/posts/${id}`);
      toast("链接已复制", "success");
    },
    [toast]
  );

  const editNotice = useCallback(() => {
    toast("完整编辑请使用桌面版", "success");
  }, [toast]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--dash-text)]">文章</h1>
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-3 space-y-2.5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索标题、摘要、标签..."
          className="w-full px-4 py-3 text-base border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none"
        />
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex-1 px-3 py-3 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] min-h-[48px]"
          >
            <option value="all">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
            <option value="archived">归档</option>
          </select>
          <span className="text-xs text-[var(--dash-muted)] self-center tabular-nums">{posts.length} 篇</span>
        </div>
      </div>

      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none overflow-hidden">
        {loading ? (
          <div className="divide-y divide-[var(--dash-border)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-sm text-[var(--dash-muted)]">没有匹配的文章</div>
        ) : (
          <div className="divide-y divide-[var(--dash-border)]">
            {posts.map((p) => (
              <div key={p.id} className="p-4 space-y-2.5">
                <button type="button" onClick={editNotice} className="w-full text-left min-h-[44px]">
                  <span className="text-[15px] font-medium text-[var(--dash-text)] line-clamp-2">
                    {p.titleZh || p.title || "未命名"}
                  </span>
                  <span className="text-xs text-[var(--dash-muted)] mt-1 block truncate">
                    {p.category?.nameZh || p.category?.name || "未分类"} · {p.status} ·{" "}
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </button>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() => togglePublish(p)}
                    className="text-xs px-2 py-2.5 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] font-medium min-h-[44px]"
                  >
                    {p.status === "published" ? "下架" : "发布"}
                  </button>
                  <button
                    onClick={() => copyLink(p.id)}
                    className="text-xs px-2 py-2.5 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] min-h-[44px]"
                  >
                    链接
                  </button>
                  <button
                    onClick={editNotice}
                    className="text-xs px-2 py-2.5 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] min-h-[44px]"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => setDelId(p.id)}
                    className="text-xs px-2 py-2.5 border border-red-200 rounded-none bg-[var(--dash-card)] text-red-600 min-h-[44px]"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!delId}
        onOpenChange={(v) => !v && setDelId(null)}
        title="确定删除？"
        description="将物理删除，不可恢复。"
        confirmText="删除"
        variant="danger"
        onConfirm={confirmDel}
      />
    </div>
  );
}
