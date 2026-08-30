"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { useLang } from "@/lib/lang-context";

interface ConfirmModalProps {
  title?: string;
  message: string;
  itemLabel?: string;
  itemDetail?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmModal({
  title,
  message,
  itemLabel,
  itemDetail,
  variant = "default",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  const { t, lang } = useLang();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const isDanger = variant === "danger";
  const modalTitle = title || (isDanger ? (lang === "zh" ? "删除确认" : "Delete Confirmation") : t.confirm);

  useEffect(() => {
    cancelRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter" && !loading) onConfirm();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, onConfirm, loading]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-[520px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "fadeIn 0.15s var(--ease-out) both" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <div className="flex items-center gap-2.5">
            {isDanger ? (
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-red-500" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-blue-500" />
              </div>
            )}
            <h3 className="text-base font-semibold text-zinc-900">{modalTitle}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-[15px] font-medium text-zinc-800 leading-relaxed">{message}</p>

          {(itemLabel || itemDetail) && (
            <div className="bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3 space-y-1.5">
              {itemLabel && (
                <div className="flex items-start gap-2">
                  <span className="text-xs text-zinc-400 shrink-0 mt-0.5">
                    {lang === "zh" ? "标题" : "Title"}
                  </span>
                  <span className="text-sm text-zinc-700 font-medium">{itemLabel}</span>
                </div>
              )}
              {itemDetail && (
                <div className="flex items-start gap-2">
                  <span className="text-xs text-zinc-400 shrink-0 mt-0.5">
                    {lang === "zh" ? "详情" : "Detail"}
                  </span>
                  <span className="text-sm text-zinc-500">{itemDetail}</span>
                </div>
              )}
            </div>
          )}

          {isDanger && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {lang === "zh" ? "此操作不可恢复，删除后无法撤回" : "This action is irreversible and cannot be undone."}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="px-5 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-white hover:border-zinc-300 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2 text-sm text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${
              isDanger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-zinc-900 hover:bg-zinc-700"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {lang === "zh" ? "处理中..." : "Processing..."}
              </span>
            ) : (
              isDanger ? (lang === "zh" ? "确认删除" : "Confirm Delete") : t.confirm
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
