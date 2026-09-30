"use client";

import { useEffect, useState } from "react";
import { PANEL_CLS } from "@/components/ui/Panel"
import { AdminTitle } from "@/components/ui/AdminTitle"
import { ConfirmDialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { ListItemSkeleton } from "@/components/dashboard/Skeleton";
import { ListError } from "@/components/ui/ListError";
import { loadList } from "@/lib/admin-fetch";
import { useLang } from "@/lib/lang-context";

interface Note {
  id: string;
  content: string;
  contentZh: string | null;
  createdAt: string;
}

/** 移动端随想速记：发布/删除 */
export default function MobileNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 50;
  const { toast } = useToast();
  const { t, lang } = useLang();

  const fetchNotes = async () => {
    const r = await loadList<any>(`/api/thoughts?page=${page}`);
    setNotes(
      r.data.map((d: any) => ({
        id: d.id,
        content: d.content || d.text || "",
        contentZh: d.contentZh || d.textZh || d.content || d.text || "",
        createdAt: d.createdAt,
      })),
    );
    setTotal(r.total);
    setLoadErr(r.error);
    setLoading(false);
  };

  useEffect(() => {
    void fetchNotes();
  }, [page]);

  const submit = async () => {
    if (!input.trim() || input.length > 500) {
      toast(lang === "zh" ? "内容需 1-500 字" : "Content must be 1-500 characters", "error");
      return;
    }
    setSending(true);
    setPage(1);
    const text = input.trim();
    // 乐观插入，列表立即可见
    setNotes((prev) => [{ id: `local-${Date.now()}`, content: text, contentZh: text, createdAt: new Date().toISOString() }, ...prev]);
    setInput("");
    const r = await fetch("/api/thoughts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      cache: "no-store",
    });
    if (!r.ok) {
      toast(t.toastPublishFail, "error");
      setNotes((prev) => prev.filter((n) => !String(n.id).startsWith("local-")));
    } else toast(t.toastPublished, "success");
    setSending(false);
    fetchNotes();
  };

  const confirmDel = async () => {
    if (!delId) return;
    setNotes((prev) => prev.filter((n) => n.id !== delId));
    setDelId(null);
    const r = await fetch(`/api/thoughts/${delId}`, { method: "DELETE", cache: "no-store" });
    if (r.ok) toast(t.dashDeleted, "success");
    else fetchNotes();
  };

  return (
    <div className="space-y-4 section-in">
      <AdminTitle>{t.dashNotes}</AdminTitle>
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-3 space-y-2.5">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={lang === "zh" ? "写点什么... (≤500字)" : "Write something... (≤500 chars)"}
          maxLength={500}
          rows={3}
          className="w-full px-4 py-3 text-base border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={sending || !input.trim()}
          className="w-full py-3 bg-[var(--dash-text)] text-[var(--dash-bg)] text-sm rounded-none disabled:opacity-50 font-medium min-h-[48px] active:opacity-60"
        >
          {t.dashPublishAction}
        </button>
      </div>
      {loading ? (
        <div className={`${PANEL_CLS} divide-y divide-[var(--dash-border)]`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {notes.map((n) => (
            <div
              key={n.id}
              className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-4 flex justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--dash-text)] leading-relaxed whitespace-pre-wrap break-words">
                  {lang === "zh" ? n.contentZh || n.content : n.content}
                </p>
                <p className="text-xs text-[var(--dash-muted)] mt-2">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setDelId(n.id)}
                className="text-xs text-[var(--dash-muted)] px-3 min-h-[48px] self-start shrink-0 active:opacity-60"
              >
                {t.dashDelete}
              </button>
            </div>
          ))}
          {notes.length === 0 &&
            (loadErr ? <ListError onRetry={() => void fetchNotes()} /> : (
              <p className="text-sm text-[var(--dash-muted)] text-center py-12">{t.noThoughts}</p>
            ))}
        </div>
      )}
      {!loading && total > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 min-h-[48px] inline-flex items-center text-xs border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] disabled:opacity-40 active:opacity-60 transition-colors"
          >
            {t.pagePrev}
          </button>
          <span className="mono text-[11px] text-[var(--dash-muted)]">
            {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(total / PAGE_SIZE)), p + 1))}
            disabled={page >= Math.ceil(total / PAGE_SIZE)}
            className="px-3 min-h-[48px] inline-flex items-center text-xs border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] disabled:opacity-40 active:opacity-60 transition-colors"
          >
            {t.pageNext}
          </button>
        </div>
      )}
      <ConfirmDialog
        open={!!delId}
        onOpenChange={(v) => !v && setDelId(null)}
        title={t.deleteThoughtConfirm}
        description={lang === "zh" ? "物理删除，不可恢复。" : "This will be permanently deleted."}
        confirmText={t.dashDelete}
        variant="danger"
        onConfirm={confirmDel}
      />
    </div>
  );
}
