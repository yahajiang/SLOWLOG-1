"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react";

export function Lightbox() {
  const [src, setSrc] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [closing, setClosing] = useState(false);

  // P2-11：关闭动画的定时器必须可清理，否则组件卸载后仍会 setState
  const closeTimerRef = useRef<number | null>(null);

  const close = useCallback(() => {
    setClosing(true);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setSrc(null);
      setAlt("");
      setScale(1);
      setRotation(0);
      setClosing(false);
      closeTimerRef.current = null;
    }, 200);
  }, []);

  useEffect(
    () => () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    },
    []
  );

  // 点击正文图片打开灯箱（常驻监听，与开关状态无关）
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
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // P2-12：快捷键仅在灯箱打开时注册。旧实现无条件常驻，以致全站任意输入框里
  // 敲 r / 0 / + / - 都会触发本组件 setState（虽然不可见，但属于无谓渲染与按键劫持）
  useEffect(() => {
    if (!src) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(s + 0.25, 3));
      if (e.key === "-") setScale((s) => Math.max(s - 0.25, 0.5));
      if (e.key === "r") setRotation((r) => r + 90);
      if (e.key === "0") { setScale(1); setRotation(0); }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [src, close]);

  if (!src) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 ${closing ? "lightbox-out" : "lightbox-in"}`} onClick={close}>
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[85vh] object-contain rounded-none shadow-2xl transition-transform duration-[300ms] ease-[var(--ease-out)]"
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
