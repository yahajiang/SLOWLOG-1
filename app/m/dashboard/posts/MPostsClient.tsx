"use client";

import { useCallback, useEffect, useState } from "react";
import { PANEL_CLS } from "@/components/ui/Panel"
import { AdminTitle } from "@/components/ui/AdminTitle"
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { DropdownSelect } from "@/components/ui/DropdownSelect";
import { ListItemSkeleton } from "@/components/dashboard/Skeleton";
import { ListError } from "@/components/ui/ListError"; 
import { loadList } from "@/lib/admin-fetch"; 

import { useLang } from "@/lib/lang-context";
import { useSiteSettings } from "@/lib/settings-context";

/** 移动端文章管理：搜索/状态/分类/排序/条数 · 上下架/删除/复制链接（编辑走桌面版） */
export default function MobilePostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [sort, setSort] = useState("updatedAt-desc");
  // 每页条数由「站点设置·每页文章数」下发（settings-context）；无值回退 15
  const siteSettings = useSiteSettings();
  const [pageSize, setPageSize] = useState(siteSettings.postsPerPage || 15);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const { toast } = useToast();
  const { t, lang } = useLang();

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status !== "all") params.set("status", status);
    const r = await loadList(`/api/posts?${params}`);
    setPosts(r.data);
    setLoadErr(r.error);
    setLoading(false);
  }, [q, status]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    void loadList("/api/categories").then((r) => setCats(r.data));
  }, []);

  const filtered = (() => {
    let list = posts.filter((p) => {
      if (catFilter !== "all" && p.category?.slug !== catFilter && p.category?.name !== catFilter) return false;
      return true;
    });
    if (sort === "featured-first") {
      return [...list].sort(
        (a, b) =>
          (b.featured ? 1 : 0) - (a.featured ? 1 : 0) ||
          new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
      );
    }
    const [key, dir] = sort.split("-");
    const mul = dir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (key === "title") {
        return mul * String(a.titleZh || a.title || "").localeCompare(String(b.titleZh || b.title || ""), "zh");
      }
      if (key === "views") return mul * ((a.viewCount || 0) - (b.viewCount || 0));
      if (key === "createdAt") return mul * (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      if (key === "publishedAt") return mul * (new Date(a.publishedAt || 0).getTime() - new Date(b.publishedAt || 0).getTime());
      return mul * (new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime());
    });
    return list;
  })();
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const confirmDel = useCallback(async () => {
    if (!delId) return;
    setPosts((prev) => prev.filter((x) => x.id !== delId));
    setDelId(null);
    const r = await fetch(`/api/posts/${delId}`, { method: "DELETE", cache: "no-store" });
    if (r.ok) toast(t.dashDeleted, "success");
    else {
      toast(t.dashOpFail, "error");
      await load();
    }
  }, [delId, toast, load, t]);

  const togglePublish = useCallback(
    async (p: any) => {
      const ns = p.status === "published" ? "draft" : "published";
      setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: ns } : x)));
      const r = await fetch(`/api/posts/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: ns }),
        cache: "no-store",
      });
      if (r.ok) {
        toast(ns === "published" ? t.toastPublished : t.toastUnpublished, "success");
      } else {
        toast(t.dashOpFail, "error");
        setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: p.status } : x)));
      }
    },
    [toast, t]
  );

  const toggleFeatured = useCallback(
    async (p: any) => {
      setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, featured: !p.featured } : x)));
      const r = await fetch(`/api/posts/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !p.featured }),
        cache: "no-store",
      });
      if (r.ok) toast(p.featured ? (lang === "zh" ? "已取消推荐" : "Unfeatured") : (lang === "zh" ? "已设为推荐" : "Featured"), "success");
      else {
        toast(t.dashOpFail, "error");
        setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, featured: p.featured } : x)));
      }
    },
    [toast, t, lang]
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
    <div className="space-y-4 section-in">
      <AdminTitle>{t.dashPosts}</AdminTitle>
      <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-3 space-y-2.5">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={t.dashSearchFull}
          className="w-full px-4 py-3 text-base border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <DropdownSelect
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[
              { value: "all", label: t.dashAll },
              { value: "published", label: t.dashPublished },
              { value: "draft", label: t.dashDraft },
              { value: "archived", label: lang === "zh" ? "归档" : "Archived" },
            ]}
            ariaLabel={t.dashAll}
            triggerClassName="min-h-[48px]"
          />
          <DropdownSelect
            value={catFilter}
            onChange={(v) => {
              setCatFilter(v);
              setPage(1);
            }}
            options={[
              { value: "all", label: lang === "zh" ? "全部分类" : "All categories" },
              ...cats.map((c: any) => ({ value: c.slug, label: c.nameZh || c.name })),
            ]}
            ariaLabel={lang === "zh" ? "分类" : "Category"}
            triggerClassName="min-h-[48px]"
          />
          <DropdownSelect
            value={sort}
            onChange={(v) => {
              setSort(v);
              setPage(1);
            }}
            options={[
              { value: "updatedAt-desc", label: lang === "zh" ? "最近更新 ↓" : "Updated ↓" },
              { value: "updatedAt-asc", label: lang === "zh" ? "最近更新 ↑" : "Updated ↑" },
              { value: "createdAt-desc", label: lang === "zh" ? "创建时间 ↓" : "Created ↓" },
              { value: "publishedAt-desc", label: lang === "zh" ? "发布时间 ↓" : "Published ↓" },
              { value: "title-asc", label: lang === "zh" ? "标题 A→Z" : "Title A→Z" },
              { value: "views-desc", label: lang === "zh" ? "浏览量 ↓" : "Views ↓" },
              { value: "featured-first", label: lang === "zh" ? "推荐优先" : "Featured first" },
            ]}
            ariaLabel={lang === "zh" ? "排序" : "Sort"}
            triggerClassName="min-h-[48px]"
          />
          <DropdownSelect
            value={String(pageSize)}
            onChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}
            options={[...new Set([10, 15, 25, 50, siteSettings.postsPerPage || 15])]
              .filter((n) => n >= 1 && n <= 100)
              .sort((a, b) => a - b)
              .map((n) => ({
                value: String(n),
                label: `${n} / ${lang === "zh" ? "页" : "page"}`,
              }))}
            ariaLabel={lang === "zh" ? "每页条数" : "Page size"}
            triggerClassName="min-h-[48px]"
          />
        </div>
        <div className="flex items-center justify-between text-xs text-[var(--dash-muted)] tabular-nums">
          <span>{lang === "zh" ? `${total} 篇 · 第 ${safePage}/${totalPages} 页` : `${total} posts · ${safePage}/${totalPages}`}</span>
          {totalPages > 1 && (
            <span className="flex gap-2">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                className="px-3 py-1.5 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] disabled:opacity-50 min-h-[48px] active:opacity-60"
              >
                {t.pagePrev}
              </button>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                className="px-3 py-1.5 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] disabled:opacity-50 min-h-[48px] active:opacity-60"
              >
                {t.pageNext}
              </button>
            </span>
          )}
        </div>
      </div>

      <div className={PANEL_CLS}>
        {loading ? (
          <div className="divide-y divide-[var(--dash-border)] stagger">
            {Array.from({ length: 5 }).map((_, i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        ) : paged.length === 0 ? (
          loadErr ? <ListError onRetry={load} /> : <div className="p-12 text-center text-sm text-[var(--dash-muted)]">{t.dashEmptyFiltered}</div>
        ) : (
          <div className="divide-y divide-[var(--dash-border)] stagger">
            {paged.map((p) => (
              <div key={p.id} className="p-4 space-y-2.5">
                <button type="button" onClick={editNotice} className="w-full text-left min-h-[48px] active:opacity-60">
                  <span className="text-[15px] font-medium text-[var(--dash-text)] line-clamp-2">
                    {(lang === "zh" ? p.titleZh || p.title : p.title) || t.dashUntitled}
                    {p.featured && (
                      <span className="ml-1.5 text-[10px] px-1 py-0.5 align-middle bg-[var(--dash-accent-soft)] text-[var(--dash-accent)] border border-[var(--dash-accent)]/20">
                        {lang === "zh" ? "推荐" : "★"}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-[var(--dash-muted)] mt-1 block truncate">
                    {(lang === "zh" ? p.category?.nameZh || p.category?.name : p.category?.name) || t.dashUncategorized} ·{" "}
                    {p.status === "published" ? t.dashPublished : p.status === "draft" ? t.dashDraft : p.status} ·{" "}
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </button>
                <div className="grid grid-cols-5 gap-1.5">
                  <button
                    onClick={() => togglePublish(p)}
                    className="text-xs px-1 py-2.5 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] font-medium min-h-[48px] active:opacity-60"
                  >
                    {p.status === "published" ? t.dashUnpublish : t.dashPublishAction}
                  </button>
                  <button
                    onClick={() => toggleFeatured(p)}
                    className={`text-xs px-1 py-2.5 border rounded-none font-medium min-h-[48px] transition-colors active:opacity-60 ${
                      p.featured
                        ? "bg-[var(--dash-accent)] text-[var(--dash-bg)] border-[var(--dash-accent)]"
                        : "bg-[var(--dash-card)] text-[var(--dash-text)] border-[var(--dash-border)]"
                    }`}
                  >
                    {p.featured ? (lang === "zh" ? "取消荐" : "Unfeat") : (lang === "zh" ? "推荐" : "Feature")}
                  </button>
                  <button
                    onClick={() => copyLink(p.id)}
                    className="text-xs px-1 py-2.5 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] min-h-[48px] active:opacity-60"
                  >
                    {t.dashLink}
                  </button>
                  <button
                    onClick={editNotice}
                    className="text-xs px-1 py-2.5 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] min-h-[48px] active:opacity-60"
                  >
                    {t.dashEdit}
                  </button>
                  <button
                    onClick={() => setDelId(p.id)}
                    className="text-xs px-1 py-2.5 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] text-[var(--dash-danger)] min-h-[48px] active:opacity-60"
                  >
                    {t.dashDelete}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--dash-border)] bg-[var(--dash-bg)] text-xs tabular-nums">
            <button
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
              className="px-3 py-2 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] disabled:opacity-50 min-h-[48px] active:opacity-60"
            >
              {t.pagePrev}
            </button>
            <span>
              {lang === "zh" ? `第 ${safePage}/${totalPages} 页` : `${safePage}/${totalPages}`}
            </span>
            <button
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
              className="px-3 py-2 border border-[var(--dash-border)] rounded-none bg-[var(--dash-card)] disabled:opacity-50 min-h-[48px] active:opacity-60"
            >
              {t.pageNext}
            </button>
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
