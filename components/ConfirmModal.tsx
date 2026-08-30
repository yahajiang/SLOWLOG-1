"use client";

import { X } from "lucide-react";
import { useLang } from "@/lib/lang-context";

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "default";
}

export function ConfirmModal({ message, onConfirm, onCancel, variant = "default" }: ConfirmModalProps) {
  const { t } = useLang();
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-[var(--yh-bg)] border border-[var(--yh-border)] shadow-lg rounded w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeIn 0.15s var(--ease-out) both" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--yh-border)]">
          <span className="text-sm font-semibold text-[var(--yh-text)]">{t.confirm}</span>
          <button onClick={onCancel} className="p-1 text-[var(--yh-muted)] hover:text-[var(--yh-text)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-[13px] text-[var(--yh-muted)] leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--yh-border)]">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-xs text-[var(--yh-muted)] border border-[var(--yh-border)] rounded hover:bg-[var(--yh-bg)] hover:text-[var(--yh-text)] transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-1.5 text-xs text-white rounded transition-colors ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-zinc-900 hover:bg-zinc-700"
            }`}
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
