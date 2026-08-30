"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useLang } from "@/lib/lang-context";

interface InputModalProps {
  title: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}

export function InputModal({ title, placeholder, onSubmit, onClose }: InputModalProps) {
  const [value, setValue] = useState("");
  const { t } = useLang();

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[var(--yh-bg)] border border-[var(--yh-border)] shadow-lg rounded w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeIn 0.15s var(--ease-out) both" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--yh-border)]">
          <span className="text-sm font-semibold text-[var(--yh-text)]">{title}</span>
          <button onClick={onClose} className="p-1 text-[var(--yh-muted)] hover:text-[var(--yh-text)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm border border-[var(--yh-border)] bg-white rounded focus:outline-none focus:border-[var(--yh-muted)] transition-colors"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-[var(--yh-muted)] border border-[var(--yh-border)] rounded hover:bg-[var(--yh-bg)] hover:text-[var(--yh-text)] transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!value.trim()}
              className="px-4 py-1.5 text-xs text-white bg-zinc-900 rounded hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            >
              {t.confirm}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
