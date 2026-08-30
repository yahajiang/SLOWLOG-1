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

  return (
    <div className="border-l-2 border-[var(--yh-border)] pl-4 py-1 transition-all duration-500 hover:border-[var(--yh-accent)] hover:pl-5"
      style={{ transitionTimingFunction: "var(--ease-spring)" }}
    >
      <p className="text-sm text-[var(--yh-text)] leading-relaxed">
        {lang === "zh" ? thought.textZh || thought.text : thought.text}
      </p>
      <time className="text-[11px] text-[var(--yh-muted)]/60 mt-1 block">
        {relative}
      </time>
    </div>
  );
}

export function Thinking() {
  const { t, lang } = useLang();
  const [thoughts, setThoughts] = useState<ThoughtData[]>([]);

  useEffect(() => {
    fetch("/api/thoughts")
      .then((res) => res.json())
      .then((data) => setThoughts(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  if (thoughts.length === 0) return null;

  return (
    <section className="pb-16">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-xs font-medium tracking-widest uppercase text-[var(--yh-muted)] mb-8">
          {t.thinking}
        </h2>
        <div className="space-y-6 stagger-children">
          {thoughts.map((thought) => (
            <ThoughtItem key={thought.id} thought={thought} lang={lang} />
          ))}
        </div>
      </div>
    </section>
  );
}
