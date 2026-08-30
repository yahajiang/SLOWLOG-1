"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

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
      if (target.tagName === "IMG" && target.closest(".prose")) {
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
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={close}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-transform duration-200"
          style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
        />
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 rounded-lg px-2 py-1.5">
          <button onClick={() => setScale((s) => Math.min(s + 0.25, 3))} className="p-1 text-white/80 hover:text-white" title="放大">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))} className="p-1 text-white/80 hover:text-white" title="缩小">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={() => setRotation((r) => r + 90)} className="p-1 text-white/80 hover:text-white" title="旋转">
            <RotateCw className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/30" />
          <button onClick={close} className="p-1 text-white/80 hover:text-white" title="关闭">
            <X className="w-4 h-4" />
          </button>
        </div>
        {alt && (
          <p className="text-center text-white/70 text-sm mt-3">{alt}</p>
        )}
      </div>
    </div>,
    document.body
  );
}
