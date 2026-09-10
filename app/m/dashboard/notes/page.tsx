"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { ListItemSkeleton } from "@/components/dashboard/Skeleton";
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
  const [sending, setSending] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);
  const { toast } = useToast();
  const { t, lang } = useLang();

  const fetchNotes = () =>
    fetch("/api/thoughts")
      .then((r) => r.json())
      .then((data) => {
        setNotes(
          Array.isArray(data)
            ? data.map((d: any) => ({
                id: d.id,
                content: d.content || d.text || "",
                contentZh: d.contentZh || d.textZh || d.content || d.text || "",
                createdAt: d.createdAt,
              }))
            : []
        );
        setLoading(false);
      });

  useEffect(() => {
    fetchNotes();
  }, []);

  const submit = async () => {
    if (!input.trim() || input.length > 500) {
      toast(lang === "zh" ? "内容需 1-500 字" : "Content must be 1-500 characters", "error");
      return;
    }
    setSending(true);
    const r = await fetch("/api/thoughts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input }),
    });
    if (!r.ok) toast(t.toastPublishFail, "error");
    else toast(t.toastPublished, "success");
    setInput("");
    setSending(false);
    fetchNotes();
  };

  const confirmDel = async () => {
    if (!delId) return;
    await fetch(`/api/thoughts/${delId}`, { method: "DELETE" });
    toast(t.dashDeleted, "success");
    setDelId(null);
    fetchNotes();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--dash-text)]">{t.dashNotes}</h1>
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
          className="w-full py-3 bg-[var(--dash-text)] text-[var(--dash-bg)] text-sm rounded-none disabled:opacity-50 font-medium min-h-[48px]"
        >
          {t.dashPublishAction}
        </button>
      </div>
      {loading ? (
        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none overflow-hidden divide-y divide-[var(--dash-border)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
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
                className="text-xs text-[var(--dash-muted)] px-3 min-h-[44px] self-start shrink-0"
              >
                {t.dashDelete}
              </button>
            </div>
          ))}
          {notes.length === 0 && (
            <p className="text-sm text-[var(--dash-muted)] text-center py-12">{t.noThoughts}</p>
          )}
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
