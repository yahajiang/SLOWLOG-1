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

function ThoughtItem({ thought, lang }: { thought: ThoughtData; lang: "zh" | "en" }) {
  const timeStr = thought.createdAt || "";
  const relative = useRelativeTime(timeStr, lang);
  const text = lang === "zh" ? thought.textZh || thought.text : thought.text;

  return (
    <div className="group relative pl-6 py-3 transition-all duration-300">
      {/* 时间线竖线 */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--yh-border)] via-[var(--yh-border)] to-transparent" />
      {/* 时间线圆点 */}
      <div className="absolute left-[-3px] top-4 w-[7px] h-[7px] rounded-full bg-[var(--yh-border)] group-hover:bg-[var(--yh-accent)] transition-colors duration-300" />
      {/* 内容 */}
      <p className="text-[14px] text-[var(--yh-text)] leading-[1.8] tracking-wide">
        {text}
      </p>
      <time className="text-[11px] text-[var(--yh-muted)] mt-2 block tracking-wide opacity-60">
        {relative}
      </time>
    </div>
  );
}

export function Thinking() {
  const { t, lang } = useLang();
  const [thoughts, setThoughts] = useState<ThoughtData[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <section className="pb-20">
      <div className="mx-auto max-w-3xl px-6">
        {/* 标题区 */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-4 rounded-full bg-[var(--yh-accent)]" />
          <h2 className="text-[13px] font-medium tracking-[0.2em] uppercase text-[var(--yh-muted)]">
            {t.thinking}
          </h2>
        </div>
        {/* 时间线 */}
        <div className="relative">
          {thoughts.map((thought, i) => (
            <div key={thought.id} className="animate-[fadeInUp_0.4s_var(--ease-out)_both]" style={{ animationDelay: `${i * 60}ms` }}>
              <ThoughtItem thought={thought} lang={lang} />
            </div>
          ))}
          {/* 时间线终点 */}
          <div className="absolute left-0 bottom-0 w-1 h-1 rounded-full bg-[var(--yh-border)] opacity-40" />
        </div>
      </div>
    </section>
  );
}
