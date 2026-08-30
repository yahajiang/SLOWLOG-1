"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/lang-context";
import type { Thought } from "@/lib/thoughts";

export function Thinking() {
  const { t, lang } = useLang();
  const [thoughts, setThoughts] = useState<Thought[]>([]);

  useEffect(() => {
    fetch("/api/thoughts")
      .then((res) => res.json())
      .then((data) => setThoughts(data))
      .catch(console.error);
  }, []);

  if (thoughts.length === 0) return null;

  return (
    <section className="pb-16">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-xs font-medium tracking-widest uppercase text-[var(--yh-muted)] mb-8">
          {t.thinking}
        </h2>
        <div className="space-y-6">
          {thoughts.map((thought, idx) => (
            <div
              key={thought.id}
              className="border-l-2 border-[var(--yh-border)] pl-4 py-1 transition-all duration-500 hover:border-[var(--yh-accent)] hover:pl-5"
              style={{
                transitionTimingFunction: "var(--ease-spring)",
                animation: `fadeInUp 0.5s var(--ease-out) both`,
                animationDelay: `${idx * 100}ms`,
              }}
            >
              <p className="text-sm text-[var(--yh-text)] leading-relaxed">
                {lang === "zh" ? thought.textZh || thought.text : thought.text}
              </p>
              <time className="text-[11px] text-[var(--yh-muted)]/60 mt-1 block">
                {lang === "zh" ? thought.timeZh || thought.time : thought.time}
              </time>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
