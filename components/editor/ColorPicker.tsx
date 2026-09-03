"use client"
import { useState } from "react"
import { Check } from "lucide-react"

const PALETTE = [
  // 黑白灰
  ["#000000", "#1C1C1E", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB", "#E5E7EB", "#F3F4F6", "#F9FAFB", "#FFFFFF"],
  // 红色系
  ["#7F1D1D", "#991B1B", "#B91C1C", "#DC2626", "#EF4444", "#F87171", "#FCA5A5", "#FECACA", "#FEE2E2", "#FEF2F2"],
  // 橙色系
  ["#7C2D12", "#9A3412", "#C2410C", "#EA580C", "#F97316", "#FB923C", "#FDBA74", "#FED7AA", "#FFEDD5", "#FFF7ED"],
  // 黄色系
  ["#713F12", "#854D0E", "#A16207", "#CA8A04", "#EAB308", "#FACC15", "#FDE047", "#FEF08A", "#FEF9C3", "#FFFBEB"],
  // 绿色系
  ["#14532D", "#166534", "#15803D", "#16A34A", "#22C55E", "#4ADE80", "#86EFAC", "#BBF7D0", "#DCFCE7", "#F0FDF4"],
  // 青色系
  ["#164E63", "#155E75", "#0E7490", "#0891B2", "#06B6D4", "#22D3EE", "#67E8F9", "#A5F3FC", "#CFFAFE", "#ECFEFF"],
  // 蓝色系
  ["#1E3A5F", "#1E40AF", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE", "#DBEAFE", "#EFF6FF", "#F0F9FF"],
  // 紫色系
  ["#3B0764", "#581C87", "#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE", "#EDE9FE", "#F5F3FF", "#FAF5FF"],
  // 粉色系
  ["#831843", "#9D174D", "#BE185D", "#EC4899", "#F472B6", "#F9A8D4", "#FBCFE8", "#FCE7F3", "#FDF2F8", "#FFF1F2"],
]

interface ColorPickerProps {
  value?: string
  onChange: (color: string) => void
  onReset?: () => void
  label?: string
}

export function ColorPicker({ value, onChange, onReset, label }: ColorPickerProps) {
  const [custom, setCustom] = useState(value || "#000000")

  return (
    <div className="p-3">
      {label && <p className="text-[11px] font-medium text-[var(--yh-muted)] mb-2">{label}</p>}
      <div className="space-y-1.5">
        {PALETTE.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map((color) => (
              <button
                key={color}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onChange(color)}
                className={`relative w-6 h-6 rounded-none border transition-all duration-100 hover:scale-110 hover:shadow-md ${
                  value === color ? "border-zinc-800 ring-2 ring-zinc-300 scale-110" : "border-[var(--yh-border)]"
                }`}
                style={{ backgroundColor: color }}
              >
                {value === color && <Check className="absolute inset-0 m-auto w-3 h-3" style={{ color: isLight(color) ? "#000" : "#fff" }} />}
              </button>
            ))}
          </div>
        ))}
      </div>
      {/* 自定义颜色输入 */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--yh-border)]">
        <input
          type="color"
          value={custom}
          onChange={(e) => { setCustom(e.target.value); onChange(e.target.value); }}
          className="w-7 h-7 rounded-none border border-[var(--yh-border)] cursor-pointer p-0"
        />
        <input
          type="text"
          value={custom}
          onChange={(e) => { const v = e.target.value; setCustom(v); if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v); }}
          placeholder="#000000"
          className="flex-1 px-2 py-1 text-[11px] font-mono border border-[var(--yh-border)] rounded-none focus:outline-none focus:border-zinc-400"
        />
      </div>
      {onReset && (
        <button onMouseDown={(e) => e.preventDefault()} onClick={onReset}
          className="w-full mt-2 text-[11px] text-[var(--yh-muted)] hover:text-zinc-700 py-1 rounded hover:bg-[var(--dash-card)] transition-colors">
          重置
        </button>
      )}
    </div>
  )
}

function isLight(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 150
}