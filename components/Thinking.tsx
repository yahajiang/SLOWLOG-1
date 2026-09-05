"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/lang-context";
import { useRelativeTime } from "@/lib/relative-time";

interface ThoughtData {
  id: string;
  text: string;
  textZh: string;
  createdAt?: string;
}

function ThoughtItem({ thought, lang, index }: { thought: ThoughtData; lang: "zh" | "en"; index: number }) {
  const timeStr = thought.createdAt || "";
  const relative = useRelativeTime(timeStr, lang);
  const text = lang === "zh" ? thought.textZh || thought.text : thought.text;

  return (
    <div
      className="group relative pl-[29px] py-[14px] transition-all duration-500 hover:pl-9"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* 时间线竖线 */}
      <div className="absolute left-[7px] top-0 bottom-0 w-px bg-gradient-to-b from-[var(--yh-accent)]/30 via-[var(--yh-border)] to-transparent" />
      {/* 时间线圆点 - 带脉动效果 */}
      <div className="absolute left-0 top-5 flex items-center justify-center">
        <div className="w-[15px] h-[15px] rounded-full border-2 border-[var(--yh-border)] bg-[var(--yh-bg)] group-hover:border-[var(--yh-accent)] group-hover:bg-[var(--yh-accent)]/10 transition-all duration-500 group-hover:scale-110" />
        <div className="absolute w-[5px] h-[5px] rounded-full bg-[var(--yh-border)] group-hover:bg-[var(--yh-accent)] transition-all duration-500" />
      </div>
      {/* 内容卡片 */}
      <div className="relative bg-[var(--yh-bg)]/50 backdrop-blur-sm rounded-none px-[18px] py-[14px] border border-transparent group-hover:border-[var(--yh-border)]/50 group-hover:bg-white/80 group-hover:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] transition-all duration-500">
        <p className="text-[14.5px] text-[var(--yh-text)] leading-[1.85] tracking-wide">
          {text}
        </p>
        <div className="flex items-center gap-2 mt-[11px]">
          <div className="w-1 h-1 rounded-full bg-[var(--yh-accent)]/40" />
          <time className="text-[11px] text-[var(--yh-muted)] tracking-wide opacity-60 group-hover:opacity-100 transition-opacity duration-300">
            {relative}
          </time>
        </div>
      </div>
    </div>
  );
}

export function Thinking() {
  const { t, lang } = useLang();
  const [thoughts, setThoughts] = useState<ThoughtData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/thoughts")
      .then((res) => res.json())
      .then((data) => {
        setThoughts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (thoughts.length === 0) return null;

  // 默认只展示 4 条，其余折叠（可展开/收起）
  const VISIBLE = 4;
  const hidden = thoughts.length - VISIBLE;
  const shown = expanded ? thoughts : thoughts.slice(0, VISIBLE);

  return (
    <section className="pb-[86px]">
      <div className="w-full max-w-[min(70%,1600px)] mx-auto px-6">
        {/* 标题区 */}
        <div className="flex items-center gap-3 mb-9">
          <div className="w-1.5 h-5 rounded-none bg-gradient-to-b from-[var(--yh-accent)] to-[var(--yh-accent)]/50" />
          <h2 className="text-[13px] font-medium tracking-[0.2em] uppercase text-[var(--yh-muted)]">
            {t.thinking}
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-[var(--yh-border)] to-transparent" />
        </div>
        {/* 时间线 */}
        <div className="relative pl-[7px]">
          {shown.map((thought, i) => (
            <div
              key={thought.id}
              className="animate-[fadeInUp_0.5s_var(--ease-out)_both]"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <ThoughtItem thought={thought} lang={lang} index={i} />
            </div>
          ))}
          {/* 时间线终点装饰 */}
          <div className="absolute left-[7px] bottom-0 flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-[var(--yh-accent)]/30" />
            <div className="w-px h-[29px] bg-gradient-to-b from-[var(--yh-accent)]/20 to-transparent mt-1" />
          </div>
        </div>
        {/* 折叠控制 */}
        {hidden > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setExpanded(!expanded)}
              className="mono text-[11px] tracking-[0.14em] uppercase px-5 py-2.5 border border-[var(--yh-border)] bg-[var(--dash-card)] text-[var(--yh-muted)] hover:text-[var(--yh-text)] hover:border-[var(--yh-muted)] transition-colors rounded-none min-h-[44px]"
            >
              {expanded
                ? (lang === "zh" ? "收起" : "Collapse")
                : (lang === "zh" ? `展开更多 · ${hidden} 条` : `Show more · ${hidden}`)}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
