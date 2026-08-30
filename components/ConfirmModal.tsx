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
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white border border-zinc-200 shadow-2xl rounded-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
          <span className="text-sm font-medium text-zinc-900">{t.confirm}</span>
          <button onClick={onCancel} className="p-1 text-zinc-400 hover:text-zinc-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm text-zinc-600 leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-zinc-100">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-xs text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-1.5 text-xs text-white rounded-lg transition-colors ${
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
