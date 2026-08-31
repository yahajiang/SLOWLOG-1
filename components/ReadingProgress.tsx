"use client";

import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let rafId: number;

    function handleScroll() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        setProgress(pct);
        setVisible(scrollTop > 200);
      });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] h-[3px] pointer-events-none transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
      <div
        className="h-full transition-[width] duration-150 ease-out rounded-r-full"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, var(--yh-accent), oklch(0.55 0.15 200))",
        }}
      />
    </div>
  );
}
