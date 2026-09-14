"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/lang-context";
import { pickTagline } from "@/lib/taglines";

// 404：幽灵数字 + 歪印 + 双语；「随机一篇」给一条探索出口。
export default function NotFound() {
  const { t, lang } = useLang();
  const router = useRouter();
  const [tagline, setTagline] = useState(t.footerTagline);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTagline(pickTagline(lang));
  }, [lang]);

  async function goRandom() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/posts");
      const j = await r.json();
      const list = Array.isArray(j) ? j : j.posts || [];
      if (!list.length) throw new Error("empty");
      const p = list[Math.floor(Math.random() * list.length)];
      router.push(`/posts/${p.id}`);
    } catch {
      router.push("/archive");
    }
  }

  return (
    <div className="min-h-screen bg-[var(--yh-bg)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* 纸纹 + 装订线：与加载/错误/登录同语言 */}
      <div className="paper-grain" aria-hidden />
      <span aria-hidden className="tick tick-tl" />
      <span aria-hidden className="tick tick-tr" />
      <span aria-hidden className="tick tick-bl" />
      <span aria-hidden className="tick tick-br" />

      <div className="relative w-full max-w-md text-center flex flex-col items-center">
        {/* 幽灵 404 + 歪印：数字轻浮，印章压角 */}
        <div className="relative select-none" style={{ animation: "nfBob 7s var(--ease-in-out) infinite" }} aria-hidden>
          <p className="serif text-[112px] sm:text-[128px] leading-none font-semibold tracking-[0.08em] text-[var(--yh-muted)]/40">
            404
          </p>
          <span className="absolute -top-2 right-1 sm:right-4 w-12 h-12 rounded-full bg-[var(--yh-text)] text-[var(--yh-bg)] flex items-center justify-center serif italic text-[17px] shadow-[0_10px_24px_rgba(0,0,0,0.16)] rotate-[-6deg]">
            S
          </span>
        </div>

        <h1 className="serif text-[26px] font-semibold tracking-tight mt-6">{t.nfHeadline}</h1>
        <p className="text-sm text-[var(--yh-muted)] mt-3 leading-relaxed max-w-xs">{t.nfHint}</p>

        <div className="flex items-center gap-3 flex-wrap justify-center mt-8">
          <Link
            href="/"
            className="px-6 py-2.5 bg-[var(--yh-text)] text-[var(--yh-bg)] text-[12px] tracking-[0.14em] uppercase hover:bg-[var(--yh-accent)] transition-colors min-h-[44px] flex items-center"
          >
            {t.notFoundBack}
          </Link>
          <Link
            href="/archive"
            className="px-6 py-2.5 border border-[var(--yh-border)] bg-[var(--dash-card)] text-[12px] tracking-[0.14em] uppercase text-[var(--yh-muted)] hover:text-[var(--yh-text)] hover:border-[var(--yh-muted)] transition-colors min-h-[44px] flex items-center"
          >
            {t.nfArchive}
          </Link>
        </div>

        <button
          type="button"
          onClick={goRandom}
          disabled={busy}
          className="mt-6 mono text-[11px] tracking-[0.18em] uppercase text-[var(--yh-muted)] underline underline-offset-4 hover:text-[var(--yh-accent)] transition-colors disabled:opacity-50"
        >
          ↻ {t.nfRandom}
        </button>

        <p className="mono text-[11px] tracking-wide text-[var(--yh-muted)]/55 mt-12">{tagline}</p>
      </div>
    </div>
  );
}
