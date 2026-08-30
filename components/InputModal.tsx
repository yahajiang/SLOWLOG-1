"use client";

import { useState } from "react";
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

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-zinc-200 shadow-2xl rounded-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
          <span className="text-sm font-medium text-zinc-900">{title}</span>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-50"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!value.trim()}
              className="px-3 py-1.5 text-xs text-white bg-zinc-900 rounded-lg hover:bg-zinc-700 disabled:opacity-40"
            >
              {t.confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
