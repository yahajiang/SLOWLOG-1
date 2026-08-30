"use client";

import { useState } from "react";

const CHAR_GROUPS = [
  {
    name: "数学",
    chars: ["±", "×", "÷", "≠", "≈", "≤", "≥", "∞", "∑", "∏", "√", "∫", "∂", "∇", "∈", "∉", "⊂", "⊃", "∪", "∩", "∀", "∃", "¬", "∧", "∨"],
  },
  {
    name: "货币",
    chars: ["$", "€", "£", "¥", "¢", "₹", "₩", "₽", "₪", "₫", "₴", "₸", "₺", "₼", "₽"],
  },
  {
    name: "箭头",
    chars: ["→", "←", "↑", "↓", "↔", "↕", "⇒", "⇐", "⇑", "⇓", "⇔", "⇕", "↗", "↘", "↙", "↖", "↪", "↩", "⟳", "↻"],
  },
  {
    name: "标点",
    chars: ["©", "®", "™", "°", "±", "¶", "§", "†", "‡", "•", "…", "‰", "‱", "※", "‽", "‸"],
  },
  {
    name: "希腊字母",
    chars: ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ι", "κ", "λ", "μ", "ν", "ξ", "π", "ρ", "σ", "τ", "υ", "φ", "χ", "ψ", "ω", "Δ", "Σ", "Ω"],
  },
  {
    name: "制表符",
    chars: ["─", "│", "┌", "┐", "└", "┘", "├", "┤", "┬", "┴", "┼", "═", "║", "╔", "╗", "╚", "╝", "╠", "╣", "╦", "╩", "╬"],
  },
  {
    name: "杂项",
    chars: ["♡", "♥", "★", "☆", "♪", "♫", "☀", "☁", "☂", "☃", "⚡", "⚽", "☕", "✅", "❌", "⭕", "❓", "❗", "💡", "🔥"],
  },
];

interface SpecialCharPickerProps {
  onInsert: (char: string) => void;
  onClose: () => void;
}

export function SpecialCharPicker({ onInsert, onClose }: SpecialCharPickerProps) {
  const [activeGroup, setActiveGroup] = useState(0);

  return (
    <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 shadow-xl rounded-lg z-50 w-72">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">特殊字符</span>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xs">✕</button>
      </div>
      <div className="flex gap-0.5 px-2 py-1.5 border-b border-zinc-100 overflow-x-auto">
        {CHAR_GROUPS.map((group, i) => (
          <button
            key={group.name}
            onClick={() => setActiveGroup(i)}
            className={`px-2 py-1 text-[10px] rounded whitespace-nowrap transition-colors ${
              activeGroup === i
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:bg-zinc-100"
            }`}
          >
            {group.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-0.5 p-2 max-h-48 overflow-y-auto">
        {CHAR_GROUPS[activeGroup].chars.map((char) => (
          <button
            key={char}
            onClick={() => { onInsert(char); onClose(); }}
            className="w-8 h-8 flex items-center justify-center text-base hover:bg-zinc-100 rounded transition-colors"
            title={char}
          >
            {char}
          </button>
        ))}
      </div>
    </div>
  );
}
