"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLang } from "@/lib/lang-context";

// 全局搜索面板（v0.3 蓝图 Chapter 01 实现）：
// `/` 或 ⌘K 唤起，Esc/遮罩/路由跳转关闭；结果按 文章/分类/随想 分组，
// 命中片段 mark 高亮，↑↓ 循环导航（左侧品牌色边线），Enter 打开。
// 索引来自 /api/search-index（运行时生成 + CDN 缓存），内存检索零依赖。
type IndexPost = { id: string; title: string; titleEn: string; excerpt: string; category: string; tags: string[]; date: string; readTime: string; body: string };
type IndexThought = { id: string; text: string; date: string };
type IndexCat = { name: string; count: number };
type IndexData = { v: number; posts: IndexPost[]; thoughts: IndexThought[]; categories: IndexCat[]; offline?: boolean };
type Row = { key: string; group: string; title: string; meta: string; kind: "post" | "cat" | "thought"; href: string; matchText: string };

const VISIBLE = 4;

export function SearchPanel() {
  const { t, lang } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<IndexData | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const indexRef = useRef<IndexData | null>(null);

  // 打开时懒加载索引（只取一次，之后用内存）
  useEffect(() => {
    if (!open || indexRef.current) return;
    setLoading(true);
    fetch("/api/search-index")
      .then((r) => r.json())
      .then((d: IndexData) => { indexRef.current = d; setIndex(d); })
      .catch(() => setIndex({ v: 1, posts: [], thoughts: [], categories: [], offline: true }))
      .finally(() => setLoading(false));
  }, [open]);

  // 全局快捷键：/ 与 ⌘K 唤起（输入框聚焦时 / 不触发），Esc 关闭
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (e.key === "Escape") { setOpen(false); return; }
      if (typing) return;
      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setOpen(true);
      }
    }
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("sl-open-search", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("sl-open-search", onOpen); };
  }, []);

  // 路由跳转自动关闭
  useEffect(() => { setOpen(false); setQuery(""); }, [pathname]);

  // 检索：子串 + 简单评分（标题 3 > 标签 2.5 > 摘要 1.5 > 正文 0.5），零依赖
  const rows = useMemo<Row[]>(() => {
    if (!index) return [];
    const q = query.trim().toLowerCase();
    const out: Row[] = [];
    const zh = lang === "zh";
    if (!q) {
      for (const p of index.posts.slice(0, 5)) out.push({ key: "p" + p.id, group: zh ? "最近文章" : "Recent", title: p.title, meta: p.date, kind: "post", href: `/posts/${p.id}`, matchText: p.title });
      return out;
    }
    const scored: { r: Row; s: number }[] = [];
    for (const p of index.posts) {
      const title = p.title, ex = p.excerpt, body = p.body;
      let s = -1;
      if (title.toLowerCase().includes(q)) s = 30;
      else if (p.tags.some((x) => x.toLowerCase().includes(q))) s = 25;
      else if (p.category.toLowerCase().includes(q)) s = 20;
      else if (ex.toLowerCase().includes(q)) s = 15;
      else if (body.toLowerCase().includes(q)) s = 10;
      if (s < 0) continue;
      if (body.toLowerCase().indexOf(q) >= 0 && s === 10) s += Math.max(0, 6 - body.toLowerCase().indexOf(q) / 4000);
      scored.push({ s, r: { key: "p" + p.id, group: zh ? "文章" : "Posts", title, meta: p.date + (p.readTime ? " · " + p.readTime : ""), kind: "post", href: `/posts/${p.id}`, matchText: title } });
    }
    for (const c of index.categories) {
      if (c.name.toLowerCase().includes(q)) scored.push({ s: 18, r: { key: "c" + c.name, group: zh ? "分类" : "Categories", title: c.name, meta: c.count + (zh ? " 篇" : " posts"), kind: "cat", href: `/archive`, matchText: c.name } });
    }
    for (const n of index.thoughts) {
      if (n.text.toLowerCase().includes(q)) {
        const d = new Date(n.date);
        scored.push({ s: 8, r: { key: "t" + n.id, group: zh ? "随想" : "Thoughts", title: n.text, meta: `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`, kind: "thought", href: `/#thoughts`, matchText: n.text } });
      }
    }
    scored.sort((a, b) => b.s - a.s);
    for (const { r } of scored.slice(0, 14)) out.push(r);
    return out;
  }, [index, query, lang]);

  // 分组渲染辅助：相邻同组插入组标
  useEffect(() => { setActive(0); }, [query]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (rows.length ? (i + 1) % rows.length : 0)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (rows.length ? (i - 1 + rows.length) % rows.length : 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const r = rows[active];
      if (r) { setOpen(false); router.push(r.href); }
    }
  };

  function highlight(text: string, q: string) {
    if (!q) return text;
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return text;
    return (<>
      {text.slice(0, i)}
      <mark style={{ background: "rgba(255,240,170,.9)", color: "inherit", padding: "0 1px" }}>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>);
  }

  if (!open) return null;

  let lastGroup = "";
  let groupIdx = -1;
  const rendered: React.ReactNode[] = [];
  rows.forEach((r, i) => {
    if (r.group !== lastGroup) {
      lastGroup = r.group;
      rendered.push(<div key={"g" + i} className="mono text-[10px] tracking-[.14em] uppercase text-[var(--yh-muted)] px-4 pt-3 pb-1">{r.group}</div>);
    }
    rendered.push(
      <div
        key={r.key}
        data-active={i === active || undefined}
        onClick={() => { setOpen(false); router.push(r.href); }}
        onMouseEnter={() => setActive(i)}
        className="sp-item"
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", cursor: "pointer",
          borderLeft: i === active ? "2px solid var(--yh-accent)" : "2px solid transparent",
          background: i === active ? "#f8f6f1" : "transparent",
        }}
      >
        <span className="text-[13px] text-[var(--yh-text)] truncate">{highlight(r.title, query.trim())}</span>
        <span className="mono text-[9px] tracking-[.1em] text-[var(--yh-muted)] border border-[var(--yh-border)] px-1.5 py-px whitespace-nowrap">{r.kind === "post" ? (lang === "zh" ? "文章" : "POST") : r.kind === "cat" ? (lang === "zh" ? "分类" : "CATEGORY") : (lang === "zh" ? "随想" : "THOUGHT")}</span>
        <span className="ml-auto mono text-[10px] text-[var(--yh-muted)] whitespace-nowrap">{r.meta}</span>
      </div>
    );
  });

  const qEmpty = query.trim() !== "" && rows.length === 0;

  return (
    <div
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.4)", backdropFilter: "blur(2px)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "10vh" }}
      role="dialog"
      aria-modal
      aria-label={lang === "zh" ? "全局搜索" : "Search"}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-[pageIn_0.25s_var(--ease-out)_both]"
        style={{ width: 520, maxWidth: "94%", background: "var(--yh-bg)", border: "1px solid #d8d6d0", overflow: "hidden" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", borderBottom: "1px solid #e8e6e0" }}>
          <span className="mono text-[13px] text-[var(--yh-muted)]">⌕</span>
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={lang === "zh" ? "搜索文章、分类、随想…" : "Search posts, categories, thoughts…"}
            spellCheck={false}
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15, color: "var(--yh-text)", caretColor: "var(--yh-accent)" }}
          />
          <span className="kbd mono text-[10px] text-[var(--yh-muted)] border border-[var(--yh-border)] px-1.5 py-0.5">Esc</span>
        </div>
        <div style={{ maxHeight: 330, overflowY: "auto", minHeight: 120 }}>
          {loading && <div className="px-4 py-6 text-center text-[12px] text-[var(--yh-muted)]">{lang === "zh" ? "索引加载中…" : "Loading index…"}</div>}
          {!loading && index?.offline && <div className="px-4 py-6 text-center text-[12px] text-[var(--yh-muted)]">{lang === "zh" ? "索引暂不可用，稍后再试" : "Index unavailable, try later"}</div>}
          {!loading && rendered}
          {!loading && qEmpty && (
            <div style={{ padding: 26, textAlign: "center" }}>
              <div style={{ display: "inline-block", border: "1px dashed #c9c7c1", padding: "14px 22px", fontSize: 12, color: "var(--yh-muted)" }}>
                {lang === "zh" ? <>没有找到「{query.trim()}」相关内容<br /><span style={{ fontSize: 11, color: "#a8a8ad" }}>试试更短的关键词</span></> : <>Nothing found for “{query.trim()}”<br /><span style={{ fontSize: 11, color: "#a8a8ad" }}>Try a shorter keyword</span></>}
              </div>
            </div>
          )}
        </div>
        <div className="mono flex items-center gap-3.5" style={{ padding: "8px 16px", borderTop: "1px solid #e8e6e0", background: "#faf9f5", fontSize: 10, color: "var(--yh-muted)" }}>
          <span>↑↓ {lang === "zh" ? "导航" : "Nav"}</span>
          <span>Enter {lang === "zh" ? "打开" : "Open"}</span>
          <span>Esc {lang === "zh" ? "关闭" : "Close"}</span>
          <span className="ml-auto tracking-[.14em] uppercase">SLOWLOG · SEARCH</span>
        </div>
      </div>
    </div>
  );
}
