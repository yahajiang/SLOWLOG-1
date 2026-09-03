"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut, RotateCw, Download, ChevronLeft, ChevronRight } from "lucide-react";

export function Lightbox() {
  const [src, setSrc] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const close = useCallback(() => {
    setSrc(null);
    setScale(1);
    setRotation(0);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" && target.closest("article")) {
        const img = target as HTMLImageElement;
        setSrc(img.src);
        setAlt(img.alt || "");
        setScale(1);
        setRotation(0);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(s + 0.25, 3));
      if (e.key === "-") setScale((s) => Math.max(s - 0.25, 0.5));
      if (e.key === "r") setRotation((r) => r + 90);
      if (e.key === "0") { setScale(1); setRotation(0); }
    }

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close]);

  if (!src) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4" onClick={close}>
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[85vh] object-contain rounded-none shadow-2xl transition-transform duration-200"
          style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
        />
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 rounded-none px-2 py-1.5 backdrop-blur-sm">
          <button onClick={() => setScale((s) => Math.min(s + 0.25, 3))} className="p-1.5 text-white/70 hover:text-white rounded transition-colors" title="Zoom in (+)">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))} className="p-1.5 text-white/70 hover:text-white rounded transition-colors" title="Zoom out (-)">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={() => setRotation((r) => r + 90)} className="p-1.5 text-white/70 hover:text-white rounded transition-colors" title="Rotate (R)">
            <RotateCw className="w-4 h-4" />
          </button>
          <button onClick={() => { setScale(1); setRotation(0); }} className="p-1.5 text-white/70 hover:text-white rounded transition-colors text-[11px] font-mono" title="Reset (0)">
            1:1
          </button>
          <div className="w-px h-4 bg-[var(--dash-card)]/20" />
          <a href={src} download className="p-1.5 text-white/70 hover:text-white rounded transition-colors" title="Download">
            <Download className="w-4 h-4" />
          </a>
          <button onClick={close} className="p-1.5 text-white/70 hover:text-white rounded transition-colors" title="Close (Esc)">
            <X className="w-4 h-4" />
          </button>
        </div>
        {alt && <p className="text-center text-white/50 text-sm mt-3 italic">{alt}</p>}
      </div>
    </div>,
    document.body
  );
}
