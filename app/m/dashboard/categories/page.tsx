"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { ListItemSkeleton } from "@/components/dashboard/Skeleton";
import { useLang } from "@/lib/lang-context";

type CatDraft = {
  id: string;
  name: string;
  nameZh: string;
  slug: string;
  description: string;
  descriptionZh: string;
};

/**
 * 移动端分类管理：新建 / 编辑 / 删除。
 *
 * 与桌面端 `app/dashboard/categories/page.tsx` 共用同一套 API 与乐观更新口径，
 * 差别只在版式：字段单列堆叠、按钮整宽、触控高度 ≥48px（手机上表格与
 * 五列并排都不可用）。`more` 页保留"只读浏览"，这一页是"能改"。
 */
export default function MobileCategoriesPage() {
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  // 新建表单默认收起：手机上五个字段常驻会把列表推到屏幕外，
  // 而"看现有分类"才是这一页的高频动作。
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [nameZh, setNameZh] = useState("");
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");
  const [descZh, setDescZh] = useState("");
  const [delId, setDelId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CatDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t, lang } = useLang();
  const zh = lang === "zh";

  const load = () =>
    fetch("/api/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setCats(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  useEffect(() => {
    void load();
  }, []);

  async function create() {
    if (!name || !slug) {
      toast(t.catNeedName, "error");
      return;
    }
    setCreating(true);
    const r = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, nameZh, slug, description: desc, descriptionZh: descZh }),
      cache: "no-store",
    });
    setCreating(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      toast(j.error || (t.catCreateFail), "error");
      return;
    }
    const created = await r.json().catch(() => null);
    toast(t.catCreated, "success");
    setName("");
    setNameZh("");
    setSlug("");
    setDesc("");
    setDescZh("");
    setShowForm(false);
    if (created?.id) setCats((prev) => [...prev, { ...created, _count: created._count ?? { posts: 0 } }]);
    else void load();
  }

  const startEdit = (c: any) => {
    setEditingId(c.id);
    setDraft({
      id: c.id,
      name: c.name || "",
      nameZh: c.nameZh || "",
      slug: c.slug || "",
      description: c.description || "",
      descriptionZh: c.descriptionZh || "",
    });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  async function saveEdit() {
    if (!draft) return;
    if (!draft.name || !draft.slug) {
      toast(t.catNeedName, "error");
      return;
    }
    setSaving(true);
    const prev = cats;
    // 乐观改写，失败回滚（与桌面端同一口径）
    setCats((list) => list.map((x) => (x.id === draft.id ? { ...x, ...draft } : x)));
    const r = await fetch(`/api/categories/${draft.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        nameZh: draft.nameZh,
        slug: draft.slug,
        description: draft.description,
        descriptionZh: draft.descriptionZh,
      }),
      cache: "no-store",
    });
    setSaving(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      toast(j.error || (t.catSaveFail), "error");
      setCats(prev);
      return;
    }
    toast(t.dashSaved, "success");
    cancelEdit();
  }

  async function confirmDel() {
    if (!delId) return;
    const removed = cats.find((c) => c.id === delId);
    setCats((prev) => prev.filter((c) => c.id !== delId));
    setDelId(null);
    const r = await fetch(`/api/categories/${delId}`, { method: "DELETE", cache: "no-store" });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      toast(j.error || (t.catDeleteFail), "error");
      if (removed) setCats((prev) => [...prev, removed]);
    } else toast(t.dashDeleted, "success");
  }

  const field =
    "block w-full mt-1 px-3 py-2.5 text-base border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none";
  const label = "text-xs text-[var(--dash-muted)]";
  // 手机上正文 16px 起：低于此 iOS 聚焦时会放大视口
  const small =
    "block w-full mt-0.5 px-3 py-2 text-base border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:border-[var(--dash-accent)] focus:outline-none";

  return (
    <div className="space-y-4 section-in">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--dash-text)]">
        {t.dashCatManage}
      </h1>

      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-4 space-y-3">
        {showForm ? (
          <>
            <div>
              <label className={label}>{t.catName}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="Design" />
            </div>
            <div>
              <label className={label}>{t.catNameZh}</label>
              <input value={nameZh} onChange={(e) => setNameZh(e.target.value)} className={field} placeholder={t.catNameZhDemo} />
            </div>
            <div>
              <label className={label}>Slug</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className={`${field} font-mono`} placeholder="design" />
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--dash-muted)]">
                {t.catSlugHint}
              </p>
            </div>
            <div>
              <label className={label}>{t.catDescEn}</label>
              <input value={desc} onChange={(e) => setDesc(e.target.value)} className={field} placeholder={t.catOptional} />
            </div>
            <div>
              <label className={label}>{t.catDescZhOpt}</label>
              <input value={descZh} onChange={(e) => setDescZh(e.target.value)} className={field} placeholder={t.catOptional} />
            </div>
            <div className="flex gap-2">
              <button
                onClick={create}
                disabled={creating || !name.trim() || !slug.trim()}
                className="flex-1 py-3 bg-[var(--dash-text)] text-[var(--dash-bg)] text-sm rounded-none disabled:opacity-50 font-medium min-h-[48px]"
              >
                {creating ? (t.catCreating) : t.catCreate}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-3 border border-[var(--dash-border)] text-sm rounded-none bg-[var(--dash-card)] min-h-[48px]"
              >
                {t.editorCancel}
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 bg-[var(--dash-text)] text-[var(--dash-bg)] text-sm rounded-none font-medium min-h-[48px]"
          >
            {t.catNew}
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none overflow-hidden divide-y divide-[var(--dash-border)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <ListItemSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none overflow-hidden divide-y divide-[var(--dash-border)]">
          {cats.map((c) => {
            const shown = zh ? c.descriptionZh || c.description : c.description || c.descriptionZh;
            return (
              <div key={c.id} className="p-4">
                {editingId === c.id && draft ? (
                  <div className="space-y-2.5">
                    <div>
                      <label className={label}>{t.catName}</label>
                      <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={small} />
                    </div>
                    <div>
                      <label className={label}>{t.catNameZh}</label>
                      <input value={draft.nameZh} onChange={(e) => setDraft({ ...draft, nameZh: e.target.value })} className={small} />
                    </div>
                    <div>
                      <label className={label}>Slug</label>
                      <input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} className={`${small} font-mono`} />
                    </div>
                    <div>
                      <label className={label}>{t.catDesc}</label>
                      <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={small} />
                    </div>
                    <div>
                      <label className={label}>{t.catDescZh}</label>
                      <input value={draft.descriptionZh} onChange={(e) => setDraft({ ...draft, descriptionZh: e.target.value })} className={small} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="flex-1 py-2.5 bg-[var(--dash-text)] text-[var(--dash-bg)] text-sm rounded-none disabled:opacity-50 min-h-[48px]"
                      >
                        {saving ? (t.catSaving) : t.catSave}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-5 py-2.5 border border-[var(--dash-border)] text-sm rounded-none bg-[var(--dash-card)] min-h-[48px]"
                      >
                        {t.editorCancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--dash-text)]">
                        {c.name} {c.nameZh && <span className="text-[var(--dash-muted)]">/ {c.nameZh}</span>}
                      </p>
                      <p className="text-xs text-[var(--dash-muted)] mt-1 break-words">
                        <span className="font-mono">{c.slug}</span> · {c._count?.posts ?? 0} {t.catPostsUnit}
                        {shown ? ` · ${shown}` : ""}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => startEdit(c)}
                          className="text-xs px-3 py-2 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] min-h-[48px]"
                        >
                          {t.dashEdit}
                        </button>
                        <button
                          onClick={() => setDelId(c.id)}
                          className="text-xs px-3 py-2 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] hover:text-[var(--dash-danger)] min-h-[48px]"
                        >
                          {t.dashDelete}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {cats.length === 0 && (
            <p className="p-12 text-center text-sm text-[var(--dash-muted)]">{t.catEmpty}</p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!delId}
        onOpenChange={(v) => !v && setDelId(null)}
        title={t.catDelTitle}
        description={t.catDelDesc}
        confirmText={t.dashDelete}
        variant="danger"
        onConfirm={confirmDel}
      />
    </div>
  );
}
