"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Save,
  FileText,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  Settings2,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import type { ContentCategory } from "@/lib/categories";
import { LangProvider, useLang } from "@/lib/lang-context";
import type { Lang } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { TiptapEditor } from "@/components/TiptapEditor";
import { useRelativeTime } from "@/lib/relative-time";

type PostSummary = {
  id: string;
  title: string;
  excerpt: string;
  category: ContentCategory;
  author: string;
  authorInitial: string;
  date: string;
  displayDate: string;
  readTime: string;
  featured?: boolean;
  tags: string[];
};

type EditorData = {
  id: string;
  title: string;
  excerpt: string;
  category: ContentCategory;
  author: string;
  authorInitial: string;
  date: string;
  readTime: string;
  featured: boolean;
  tags: string;
  markdown: string;
};

const emptyEditor: EditorData = {
  id: "",
  title: "",
  excerpt: "",
  category: "Design",
  author: "Yahajiang",
  authorInitial: "Y",
  date: new Date().toISOString().slice(0, 10),
  readTime: "5 min",
  featured: false,
  tags: "",
  markdown: "",
};

function ThoughtItem({
  thought,
  lang,
  editingThought,
  setEditingThought,
  setEditThoughtText,
  setEditThoughtTextZh,
  editThoughtText,
  editThoughtTextZh,
  updateThought,
  deleteThought,
  t,
}: {
  thought: { id: string; text: string; textZh: string; createdAt?: string };
  lang: Lang;
  editingThought: string | null;
  setEditingThought: (id: string | null) => void;
  setEditThoughtText: (text: string) => void;
  setEditThoughtTextZh: (text: string) => void;
  editThoughtText: string;
  editThoughtTextZh: string;
  updateThought: (id: string) => void;
  deleteThought: (id: string) => void;
  t: ReturnType<typeof useLang>["t"];
}) {
  const relative = useRelativeTime(thought.createdAt || thought.id, lang);

  return (
    <div
      key={thought.id}
      className="border border-zinc-100 bg-white p-3 rounded hover:border-zinc-200 transition-colors"
    >
      {editingThought === thought.id ? (
        <div className="space-y-2">
          <input
            value={editThoughtTextZh}
            onChange={(e) => setEditThoughtTextZh(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-zinc-200 focus:outline-none focus:border-zinc-400"
            placeholder="中文"
          />
          <input
            value={editThoughtText}
            onChange={(e) => setEditThoughtText(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-zinc-200 focus:outline-none focus:border-zinc-400"
            placeholder="English"
          />
          <div className="flex gap-2">
            <button
              onClick={() => updateThought(thought.id)}
              className="px-3 py-1 bg-zinc-900 text-white text-xs rounded hover:bg-zinc-700"
            >
              {lang === "zh" ? "保存" : "Save"}
            </button>
            <button
              onClick={() => setEditingThought(null)}
              className="px-3 py-1 border border-zinc-200 text-xs rounded hover:bg-zinc-50"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-700 line-clamp-2">
              {lang === "zh" ? thought.textZh || thought.text : thought.text}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              {relative}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => {
                setEditingThought(thought.id);
                setEditThoughtText(thought.text);
                setEditThoughtTextZh(thought.textZh);
              }}
              className="w-7 h-7 flex items-center justify-center border border-zinc-200 rounded hover:bg-zinc-50 transition-colors"
              title={t.edit}
            >
              <Pencil className="w-3 h-3 text-zinc-500" />
            </button>
            <button
              onClick={() => deleteThought(thought.id)}
              className="w-7 h-7 flex items-center justify-center border border-zinc-200 rounded hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
              title={t.delete}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { sanitizeId } from "@/lib/api-utils";

function catLabel(cat: string, t: ReturnType<typeof useLang>["t"]): string {
  if (cat === "All") return t.catAll;
  if (cat === "Design") return t.catDesign;
  if (cat === "Plugin") return t.catPlugin;
  if (cat === "Engineering") return t.catEngineering;
  if (cat === "Typography") return t.catTypography;
  if (cat === "Frontend") return t.catFrontend;
  if (cat === "Snippet") return t.catSnippet;
  return cat;
}

function AdminInner() {
  const { t, lang } = useLang();
  const router = useRouter();
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [query, setQuery] = useState("");
  const [filterCat, setFilterCat] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditorData | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showMeta, setShowMeta] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  
  // Thoughts state
  const [thoughts, setThoughts] = useState<{ id: string; text: string; textZh: string; time: string; timeZh: string }[]>([]);
  const [showThoughts, setShowThoughts] = useState(false);
  const [newThoughtText, setNewThoughtText] = useState("");
  const [newThoughtTextZh, setNewThoughtTextZh] = useState("");
  const [editingThought, setEditingThought] = useState<string | null>(null);
  const [editThoughtText, setEditThoughtText] = useState("");
  const [editThoughtTextZh, setEditThoughtTextZh] = useState("");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function fetchPosts() {
    setLoading(true);
    try {
      const res = await fetch("/api/posts?drafts=true", { cache: "no-store", credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setPosts([]);
      setToast("加载失败，请检查网络");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
    fetchThoughts();
  }, []);

  async function fetchThoughts() {
    try {
      const res = await fetch("/api/thoughts", { cache: "no-store", credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setThoughts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error(error);
    }
  }

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToastType(type);
    setToast(msg);
  }

  async function addThought() {
    if (!newThoughtText.trim() && !newThoughtTextZh.trim()) {
      showToast(lang === "zh" ? "请输入随想内容" : "Please enter thought content", "error");
      return;
    }
    try {
      const res = await fetch("/api/thoughts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: newThoughtText, textZh: newThoughtTextZh }),
      });
      if (res.ok) {
        setNewThoughtText("");
        setNewThoughtTextZh("");
        fetchThoughts();
        showToast(lang === "zh" ? "随想已添加" : "Thought added", "success");
      } else {
        const j = await res.json().catch(() => ({}));
        showToast(j.error || (lang === "zh" ? "添加失败" : "Add failed"), "error");
      }
    } catch (error) {
      console.error(error);
      showToast(lang === "zh" ? "网络错误" : "Network error", "error");
    }
  }

  async function updateThought(id: string) {
    if (!editThoughtText.trim() && !editThoughtTextZh.trim()) {
      showToast(lang === "zh" ? "请输入随想内容" : "Please enter thought content", "error");
      return;
    }
    try {
      const res = await fetch(`/api/thoughts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: editThoughtText, textZh: editThoughtTextZh }),
      });
      if (res.ok) {
        setEditingThought(null);
        fetchThoughts();
        showToast(lang === "zh" ? "随想已更新" : "Thought updated", "success");
      } else {
        const j = await res.json().catch(() => ({}));
        showToast(j.error || (lang === "zh" ? "更新失败" : "Update failed"), "error");
      }
    } catch (error) {
      console.error(error);
      showToast(lang === "zh" ? "网络错误" : "Network error", "error");
    }
  }

  async function deleteThought(id: string) {
    if (!confirm(lang === "zh" ? "确定删除这条随想？" : "Delete this thought?")) return;
    try {
      const res = await fetch(`/api/thoughts/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        fetchThoughts();
        showToast(lang === "zh" ? "随想已删除" : "Thought deleted", "success");
      } else {
        const j = await res.json().catch(() => ({}));
        showToast(j.error || (lang === "zh" ? "删除失败" : "Delete failed"), "error");
      }
    } catch (error) {
      console.error(error);
      showToast(lang === "zh" ? "网络错误" : "Network error", "error");
    }
  }

  useEffect(() => {
    if (toast) {
      const toastTimer = setTimeout(() => setToast(null), 2200);
      return () => clearTimeout(toastTimer);
    }
  }, [toast]);

  const filtered = posts.filter((p) => {
    const q = query.toLowerCase().trim();
    const matchQ =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.tags.join(" ").toLowerCase().includes(q);
    const matchCat = filterCat === "All" || p.category === filterCat;
    return matchQ && matchCat;
  });

  function openNew() {
    const newId = `post-${Date.now()}`;
    setEditing({ ...emptyEditor, id: newId, date: new Date().toISOString().slice(0, 10) });
    setIsNew(true);
    setShowMeta(true);
  }

  async function openEdit(id: string) {
    try {
      const res = await fetch(`/api/posts/${id}`, { credentials: "include", cache: "no-store" });
      if (!res.ok) return setToast("加载失败");
      const post = await res.json();
      setEditing({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        author: post.author,
        authorInitial: post.authorInitial,
        date: post.date,
        readTime: post.readTime,
        featured: !!post.featured,
        tags: post.tags.join(", "),
        markdown: post.markdown || post.markdownZh || "",
      });
      setIsNew(false);
      setShowMeta(false);
    } catch {
      setToast("加载失败");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t.deleteConfirm(id))) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setToast(t.deleteSuccess);
        fetchPosts();
      } else {
        const j = await res.json().catch(() => ({}));
        setToast(j.error || "删除失败");
      }
    } catch {
      setToast("网络错误");
    }
  }

  async function handleBatchDelete() {
    if (selectedPosts.size === 0) return;
    if (!confirm(lang === "zh" ? `确定删除选中的 ${selectedPosts.size} 篇文章？` : `Delete ${selectedPosts.size} selected posts?`)) return;
    try {
      const res = await fetch("/api/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: Array.from(selectedPosts) }),
      });
      if (res.ok) {
        setSelectedPosts(new Set());
        setToast(lang === "zh" ? "已批量删除" : "Batch deleted");
        fetchPosts();
      } else {
        const j = await res.json().catch(() => ({}));
        setToast(j.error || "删除失败");
      }
    } catch {
      setToast("网络错误");
    }
  }

  function toggleSelectAll() {
    if (selectedPosts.size === filtered.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(filtered.map((p) => p.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const handleSave = useCallback(async () => {
    if (!editing) return;
    // Validation with red popup
    if (!editing.title.trim()) {
      showToast(lang === "zh" ? "标题不能为空" : "Title is required", "error");
      setShowValidation(true);
      return;
    }
    if (!editing.excerpt.trim()) {
      showToast(lang === "zh" ? "摘要不能为空" : "Excerpt is required", "error");
      setShowValidation(true);
      return;
    }
    if (!editing.date) {
      showToast(lang === "zh" ? "日期不能为空" : "Date is required", "error");
      setShowValidation(true);
      return;
    }
    if (!editing.markdown.trim()) {
      showToast(lang === "zh" ? "正文不能为空" : "Content is required", "error");
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    setSaving(true);
    const payload = {
      id: editing.id,
      title: editing.title.trim(),
      excerpt: editing.excerpt.trim(),
      category: editing.category,
      author: editing.author.trim() || "Anonymous",
      authorInitial: editing.authorInitial.trim() || editing.author[0]?.toUpperCase() || "Y",
      date: editing.date,
      displayDate: new Date(editing.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      readTime: editing.readTime,
      featured: editing.featured,
      tags: editing.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      markdown: editing.markdown,
    };

    const url = isNew ? "/api/posts" : `/api/posts/${editing.id}`;
    const method = isNew ? "POST" : "PUT";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      showToast(isNew ? t.publishSuccess : t.updateSuccess, "success");
      setEditing(null);
      fetchPosts();
    } else {
      const j = await res.json().catch(() => ({}));
      showToast(j.error || (lang === "zh" ? "保存失败" : "Save failed"), "error");
    }
  }, [editing, isNew, t, lang]);

  const autoSaveTimerRef2 = useRef<NodeJS.Timeout | null>(null);

  const handleAutoSave = useCallback((markdown: string) => {
    setEditing((prev) => (prev ? { ...prev, markdown } : null));
    if (autoSaveTimerRef2.current) clearTimeout(autoSaveTimerRef2.current);
    autoSaveTimerRef2.current = setTimeout(async () => {
      setEditing((prev) => {
        if (!prev || !prev.id || !prev.title.trim()) return prev;
        const payload = {
          id: prev.id,
          title: prev.title.trim(),
          excerpt: prev.excerpt.trim(),
          category: prev.category,
          author: prev.author.trim() || "Anonymous",
          authorInitial: prev.authorInitial.trim() || "Y",
          date: prev.date,
          readTime: prev.readTime,
          featured: prev.featured,
          tags: prev.tags.split(",").map((t) => t.trim()).filter(Boolean),
          markdown,
        };
        fetch("/api/posts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }).catch(() => {});
        return prev;
      });
    }, 3000);
  }, []);

  // ============================================================
  // LIST VIEW
  // ============================================================

  if (!editing) {
    return (
      <div className="min-h-screen bg-[var(--yh-bg)]">
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[var(--yh-border)]">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <Link href="/" className="text-sm font-semibold tracking-tight hover:opacity-60 transition-opacity">
                {t.siteName}
              </Link>
              <span className="hidden sm:inline text-[11px] tracking-widest uppercase text-zinc-400 border-l border-[var(--yh-border)] pl-4">
                {t.adminTitle}
              </span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              <LanguageSwitcher />
              <Link
                href="/"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs border border-[var(--yh-border)] bg-white/80 px-3 py-2 hover:border-zinc-400 transition-colors rounded"
              >
                <Eye className="w-3.5 h-3.5" /> {t.viewBlog}
              </Link>
              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs border border-zinc-200 bg-white/80 px-3 py-2 hover:border-zinc-400 hover:text-red-600 transition-colors rounded text-zinc-600"
              >
                <LogOut className="w-3.5 h-3.5" /> 退出              </button>
              <button
                onClick={openNew}
                className="inline-flex items-center gap-1.5 md:gap-2 bg-zinc-900 text-white text-xs tracking-widest uppercase px-3 md:px-4 py-2 md:py-2.5 hover:bg-zinc-700 transition-colors rounded shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t.newPost}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-3 gap-3 mb-6 stagger-children">
            <div className="border border-[var(--yh-border)] bg-white/80 backdrop-blur-sm p-4 hover:border-zinc-300 hover:shadow-sm transition-all duration-200 rounded">
              <p className="text-[11px] tracking-widest uppercase text-zinc-400">{t.totalPosts}</p>
              <p className="text-2xl font-semibold mt-1">{posts.length}</p>
            </div>
            <div className="border border-[var(--yh-border)] bg-white/80 backdrop-blur-sm p-4 hover:border-zinc-300 hover:shadow-sm transition-all duration-200 rounded">
              <p className="text-[11px] tracking-widest uppercase text-zinc-400">{t.categories}</p>
              <p className="text-2xl font-semibold mt-1">{CATEGORIES.length - 1}</p>
            </div>
            <div className="border border-[var(--yh-border)] bg-white/80 backdrop-blur-sm p-4 hover:border-zinc-300 hover:shadow-sm transition-all duration-200 rounded">
              <p className="text-[11px] tracking-widest uppercase text-zinc-400">{t.storage}</p>
              <p className="text-xs font-mono mt-2 text-zinc-600">{t.storageValue}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchHint}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-[var(--yh-border)] bg-white/80 focus:outline-none focus:border-zinc-400 transition-colors rounded"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={`px-3 py-2 text-xs tracking-widest uppercase whitespace-nowrap border transition-all duration-200 rounded ${
                    filterCat === cat
                      ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                      : "bg-white/80 text-zinc-500 border-[var(--yh-border)] hover:border-zinc-400 hover:text-zinc-700"
                  }`}
                >
                  {catLabel(cat, t)}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-[var(--yh-border)] bg-white/80 backdrop-blur-sm rounded">
            <div className="px-4 py-3 border-b border-[var(--yh-border)] flex items-center justify-between bg-zinc-50/30">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedPosts.size === filtered.length}
                  onChange={toggleSelectAll}
                  className="rounded border-zinc-300"
                />
                <p className="text-xs font-medium tracking-widest uppercase text-zinc-500">
                  {t.postsCount(filtered.length, filterCat, query)}
                </p>
                {selectedPosts.size > 0 && (
                  <button
                    onClick={handleBatchDelete}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    {lang === "zh" ? `删除选中 (${selectedPosts.size})` : `Delete (${selectedPosts.size})`}
                  </button>
                )}
              </div>
              <span className="text-[11px] text-zinc-400 hidden sm:inline">{t.clickToEdit}</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-sm text-zinc-400">{t.loading}</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-8 h-8 mx-auto text-zinc-300 mb-3" />
                <p className="text-sm text-zinc-500">{t.noMatch}</p>
                <button onClick={openNew} className="mt-3 text-xs underline underline-offset-4">
                  {t.createFirst}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 stagger-children">
                {filtered.map((post) => (
                  <div key={post.id} className="group px-4 py-4 flex items-start gap-4 hover:bg-zinc-50/70 transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={selectedPosts.has(post.id)}
                      onChange={() => toggleSelect(post.id)}
                      className="mt-1 rounded border-zinc-300 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] px-2 py-0.5 border font-semibold tracking-widest uppercase ${
                            post.category === "Design"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : post.category === "Plugin"
                                ? "bg-violet-50 text-violet-700 border-violet-200"
                                : post.category === "Engineering"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : post.category === "Typography"
                                    ? "bg-teal-50 text-teal-700 border-teal-200"
                                    : post.category === "Frontend"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {catLabel(post.category, t)}
                        </span>
                        {post.featured && (
                          <span className="text-[10px] tracking-widest uppercase text-amber-600 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> {t.featured}
                          </span>
                        )}
                        <span className="text-[11px] text-zinc-400">{post.displayDate} 路 {post.readTime}</span>
                      </div>
                      <h3 className="text-[15px] font-semibold text-zinc-900 truncate">{post.title}</h3>
                      <p className="text-xs text-zinc-500 line-clamp-1 mt-1">{post.excerpt}</p>
                      <div className="flex gap-1.5 mt-2">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] bg-zinc-50 border border-zinc-100 px-1.5 py-0.5 text-zinc-400">
                            {tag}
                          </span>
                        ))}
                        <span className="text-[10px] text-zinc-400 font-mono">/{post.id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/posts/${post.id}`}
                        target="_blank"
                        className="w-8 h-8 flex items-center justify-center border border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50 transition-all duration-200"
                        title={t.preview}
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                      </Link>
                      <button
                        onClick={() => openEdit(post.id)}
                        className="w-8 h-8 flex items-center justify-center border border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-700 hover:scale-105 transition-all duration-200"
                        title={t.edit}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="w-8 h-8 flex items-center justify-center border border-zinc-200 bg-white hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                        title={t.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-zinc-400 mt-4 text-center">
            {t.fileHint}
          </p>
        </div>

        {/* Thoughts Management Section */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <button
            onClick={() => setShowThoughts(!showThoughts)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-900 hover:text-[var(--yh-accent)] transition-colors mb-4"
          >
            <MessageSquare className="w-4 h-4" />
            {lang === "zh" ? "随想管理" : "Thoughts Management"}
            <span className="text-[11px] text-zinc-400">({thoughts.length})</span>
            <ChevronLeft className={`w-4 h-4 transition-transform ${showThoughts ? "-rotate-90" : ""}`} />
          </button>

          {showThoughts && (
            <div className="border border-[var(--yh-border)] bg-white/80 backdrop-blur-sm rounded p-4">
              {/* Add new thought */}
              <div className="mb-6 pb-4 border-b border-zinc-100">
                <p className="text-[11px] tracking-widest uppercase text-zinc-500 font-medium mb-3">
                  {lang === "zh" ? "添加新随想" : "Add New Thought"}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">
                      {lang === "zh" ? "中文" : "Chinese"}
                    </label>
                    <input
                      value={newThoughtTextZh}
                      onChange={(e) => setNewThoughtTextZh(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:outline-none transition-colors"
                      placeholder={lang === "zh" ? "输入中文随想..." : "Enter Chinese thought..."}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">English</label>
                    <input
                      value={newThoughtText}
                      onChange={(e) => setNewThoughtText(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:outline-none transition-colors"
                      placeholder={lang === "zh" ? "输入英文随想..." : "Enter English thought..."}
                    />
                  </div>
                </div>
                <button
                  onClick={addThought}
                  disabled={!newThoughtText && !newThoughtTextZh}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-xs tracking-widest uppercase hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {lang === "zh" ? "添加" : "Add"}
                </button>
              </div>

              {/* Thoughts list */}
              <div className="space-y-3">
                {thoughts.length === 0 ? (
                  <p className="text-sm text-zinc-400 text-center py-4">
                    {lang === "zh" ? "暂无随想" : "No thoughts yet"}
                  </p>
                ) : (
                  thoughts.map((thought) => (
                    <ThoughtItem
                      key={thought.id}
                      thought={thought}
                      lang={lang}
                      editingThought={editingThought}
                      setEditingThought={setEditingThought}
                      setEditThoughtText={setEditThoughtText}
                      setEditThoughtTextZh={setEditThoughtTextZh}
                      editThoughtText={editThoughtText}
                      editThoughtTextZh={editThoughtTextZh}
                      updateThought={updateThought}
                      deleteThought={deleteThought}
                      t={t}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // EDITOR VIEW 鈥?WordPress 椋庢牸
  // ============================================================

  return (
    <div className="h-screen flex flex-col bg-[var(--yh-bg)] overflow-hidden">
      {/* 鈹€鈹€ Top Bar 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ */}
      <header className="shrink-0 h-12 bg-white/80 backdrop-blur-xl border-b border-[var(--yh-border)] px-3 md:px-4 flex items-center justify-between gap-2 md:gap-4 z-40">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <button
            onClick={() => setEditing(null)}
            className="w-8 h-8 flex items-center justify-center hover:bg-zinc-100/80 transition-colors rounded shrink-0"
            title={lang === "zh" ? "返回列表" : "Back to list"}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            value={editing.title}
            onChange={(e) => {
              const v = e.target.value;
              setEditing((prev) =>
                prev ? { ...prev, title: v } : null
              );
            }}
            placeholder={lang === "zh" ? "无标题" : "Untitled"}
            className="flex-1 text-sm font-semibold text-zinc-900 bg-transparent border-none outline-none placeholder:text-zinc-300 truncate min-w-0"
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <LanguageSwitcher />
          <button
            onClick={handleLogout}
            className="hidden sm:flex w-8 h-8 items-center justify-center hover:bg-zinc-100/80 transition-colors rounded text-zinc-500 hover:text-red-600"
            title={lang === "zh" ? "退出登录" : "Logout"}
          >
            <LogOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowMeta(!showMeta)}
            className={`w-8 h-8 flex items-center justify-center rounded transition-all duration-200 ${
              showMeta ? "bg-zinc-900 text-white shadow-sm" : "hover:bg-zinc-100/80 text-zinc-600"
            }`}
            title={lang === "zh" ? "文章设置" : "Post settings"}
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <Link
            href={`/posts/${editing.id}`}
            target="_blank"
            className="hidden sm:flex w-8 h-8 items-center justify-center hover:bg-zinc-100/80 transition-colors rounded text-zinc-600"
            title={lang === "zh" ? "预览" : "Preview"}
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1 md:gap-1.5 px-3 md:px-4 py-1.5 bg-zinc-900 text-white text-[11px] tracking-widest uppercase hover:bg-zinc-700 disabled:opacity-60 transition-colors rounded shadow-sm"
          >
            {saving ? (
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <Save className="w-3 h-3" />
            )} <span className="hidden sm:inline">{saving ? t.saving : isNew ? t.publish : t.save}</span>
          </button>
        </div>
      </header>

      {/* 鈹€鈹€ Main Area 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar: Metadata (collapsible) */}
        <aside
          className={`shrink-0 bg-white/80 backdrop-blur-sm border-r border-[var(--yh-border)] overflow-y-auto flex flex-col transition-all duration-300 ${
            showMeta ? "w-72 opacity-100" : "w-0 opacity-0 overflow-hidden"
          }`}
          style={{ transitionTimingFunction: "var(--ease-spring)" }}
        >
            <div className="p-4 space-y-4 border-b border-[var(--yh-border)]">
              <p className="text-[10px] tracking-widest uppercase text-zinc-400 font-medium">
                {lang === "zh" ? "文章设置" : "Post Settings"}
              </p>

              {/* Category */}
              <div>
                <label className="text-[11px] tracking-widest uppercase text-zinc-500 font-medium block mb-1.5">
                  {t.formCategory}
                </label>
                <select
                  value={editing.category}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, category: e.target.value as ContentCategory } : null
                    )
                  }
                  className="w-full px-3 py-2 text-sm border border-[var(--yh-border)] bg-white/80 focus:outline-none focus:border-zinc-400 transition-colors"
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>{catLabel(c, t)}</option>
                  ))}
                </select>
              </div>

              {/* Author */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] tracking-widest uppercase text-zinc-500 font-medium block mb-1.5">
                    {t.formAuthor}
                  </label>
                  <input
                    value={editing.author}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev
                          ? { ...prev, author: e.target.value, authorInitial: e.target.value[0]?.toUpperCase() || prev.authorInitial }
                          : null
                      )
                    }
                    className="w-full px-3 py-2 text-sm border border-zinc-200 bg-white focus:outline-none focus:border-zinc-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] tracking-widest uppercase text-zinc-500 font-medium block mb-1.5">
                    {t.formDate}
                  </label>
                  <input
                    type="date"
                    value={editing.date}
                    onChange={(e) =>
                      setEditing((prev) => (prev ? { ...prev, date: e.target.value } : null))
                    }
                    className={`w-full px-3 py-2 text-sm border bg-white focus:outline-none focus:border-zinc-400 ${showValidation && !editing.date ? "border-red-500 bg-red-50" : "border-zinc-200"}`}
                  />
                  {showValidation && !editing.date && (
                    <p className="text-xs text-red-500 mt-1">日期不能为空</p>
                  )}
                </div>
              </div>

              {/* Read Time */}
              <div>
                <label className="text-[11px] tracking-widest uppercase text-zinc-500 font-medium block mb-1.5">
                  {t.formReadTime}
                </label>
                <input
                  value={editing.readTime}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, readTime: e.target.value } : null))
                  }
                  placeholder="5 min"
                  className="w-full px-3 py-2 text-sm border border-zinc-200 bg-white focus:outline-none focus:border-zinc-400"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="text-[11px] tracking-widest uppercase text-zinc-500 font-medium block mb-1.5">
                  Slug
                </label>
                <input
                  value={editing.id}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, id: sanitizeId(e.target.value) } : null))
                  }
                  placeholder={t.formSlugHint}
                  className="w-full px-3 py-2 text-sm font-mono border border-zinc-200 bg-zinc-50 focus:outline-none focus:border-zinc-400"
                  disabled={!isNew}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-[11px] tracking-widest uppercase text-zinc-500 font-medium block mb-1.5">
                  {t.formTags}
                </label>
                <input
                  value={editing.tags}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, tags: e.target.value } : null))
                  }
                  placeholder={t.formTagsPlaceholder}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 bg-white focus:outline-none focus:border-zinc-400 transition-colors"
                />
              </div>

              {/* Featured */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.featured}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, featured: e.target.checked } : null))
                  }
                  className="rounded"
                />
                <span className="text-xs tracking-widest uppercase font-medium text-zinc-600">{t.formFeatured}</span>
              </label>
            </div>

            {/* Excerpt */}
            <div className="p-4 flex-1">
              <label className="text-[11px] tracking-widest uppercase text-zinc-500 font-medium block mb-1.5">
                {t.formExcerpt}
              </label>
              <textarea
                value={editing.excerpt}
                onChange={(e) =>
                  setEditing((prev) => (prev ? { ...prev, excerpt: e.target.value } : null))
                }
                placeholder={t.formExcerptHint}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-zinc-200 bg-white focus:outline-none focus:border-zinc-400 resize-none"
              />
            </div>
          </aside>

        {/* Center: Editor */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <TiptapEditor
            initialMarkdown={editing.markdown}
            onSave={(md) => setEditing((prev) => (prev ? { ...prev, markdown: md } : null))}
            onAutoSave={handleAutoSave}
            postId={isNew ? undefined : editing.id}
            postTitle={editing.title}
          />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 text-sm px-5 py-2.5 rounded-lg shadow-xl z-50 ${toastType === "error" ? "bg-red-600 text-white" : "bg-zinc-900 text-white"}`}
          style={{ animation: "toastIn 0.35s var(--ease-out) both" }}
        >
          <div className="flex items-center gap-2">
            {toastType === "error" ? (
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <LangProvider>
      <AdminInner />
    </LangProvider>
  );
}
