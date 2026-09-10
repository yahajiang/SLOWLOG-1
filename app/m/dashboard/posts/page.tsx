"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ListItemSkeleton } from "@/components/dashboard/Skeleton";
import { useLang } from "@/lib/lang-context";

/** 移动端文章管理：搜索/状态筛选/上下架/删除/复制链接（编辑走桌面版） */
export default function MobilePostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [delId, setDelId] = useState<string | null>(null);
  const { toast } = useToast();
  const { t, lang } = useLang();

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
    const timer = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const confirmDel = useCallback(async () => {
    if (!delId) return;
    const r = await fetch(`/api/posts/${delId}`, { method: "DELETE" });
    if (r.ok) toast(t.dashDeleted, "success");
    else toast(t.dashOpFail, "error");
    setDelId(null);
    await load();
  }, [delId, toast, load, t]);

  const togglePublish = useCallback(
    async (p: any) => {
      const ns = p.status === "published" ? "draft" : "published";
      const r = await fetch(`/api/posts/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: ns }),
      });
      if (r.ok) toast(ns === "published" ? t.toastPublished : t.toastUnpublished, "success");
      else toast(t.dashOpFail, "error");
      await load();
    },
    [toast, load, t]
  );

  const copyLink = useCallback(
    async (id: string) => {
      await navigator.clipboard.writeText(`${location.origin}/posts/${id}`);
      toast(t.toastCopiedLink, "success");
    },
    [toast, t]
  );

  const editNotice = useCallback(() => {
    toast(t.dashEditOnDesktop, "success");
  }, [toast, t]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--dash-text)]">{t.dashPosts}</h1>
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-3 space-y-2.5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.dashSearchFull}
          className="w-full px-4 py-3 text-base border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none"
        />
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex-1 px-3 py-3 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] min-h-[48px]"
          >
            <option value="all">{t.dashAll}</option>
            <option value="published">{t.dashPublished}</option>
            <option value="draft">{t.dashDraft}</option>
            <option value="archived">{lang === "zh" ? "归档" : "Archived"}</option>
          </select>
          <span className="text-xs text-[var(--dash-muted)] self-center tabular-nums">
            {t.dashPostsCount(posts.length)}
          </span>
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
          <div className="p-12 text-center text-sm text-[var(--dash-muted)]">{t.dashEmptyFiltered}</div>
        ) : (
          <div className="divide-y divide-[var(--dash-border)]">
            {posts.map((p) => (
              <div key={p.id} className="p-4 space-y-2.5">
                <button type="button" onClick={editNotice} className="w-full text-left min-h-[44px]">
                  <span className="text-[15px] font-medium text-[var(--dash-text)] line-clamp-2">
                    {(lang === "zh" ? p.titleZh || p.title : p.title) || t.dashUntitled}
                  </span>
                  <span className="text-xs text-[var(--dash-muted)] mt-1 block truncate">
                    {(lang === "zh" ? p.category?.nameZh || p.category?.name : p.category?.name) || t.dashUncategorized} ·{" "}
                    {p.status === "published" ? t.dashPublished : p.status === "draft" ? t.dashDraft : p.status} ·{" "}
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </button>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() => togglePublish(p)}
                    className="text-xs px-2 py-2.5 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] font-medium min-h-[44px]"
                  >
                    {p.status === "published" ? t.dashUnpublish : t.dashPublishAction}
                  </button>
                  <button
                    onClick={() => copyLink(p.id)}
                    className="text-xs px-2 py-2.5 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] min-h-[44px]"
                  >
                    {t.dashLink}
                  </button>
                  <button
                    onClick={editNotice}
                    className="text-xs px-2 py-2.5 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] min-h-[44px]"
                  >
                    {t.dashEdit}
                  </button>
                  <button
                    onClick={() => setDelId(p.id)}
                    className="text-xs px-2 py-2.5 border border-red-200 rounded-none bg-[var(--dash-card)] text-red-600 min-h-[44px]"
                  >
                    {t.dashDelete}
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
        title={t.editorDeleteConfirm}
        description={t.editorDeleteDesc("")}
        confirmText={t.dashDelete}
        variant="danger"
        onConfirm={confirmDel}
      />
    </div>
  );
}
