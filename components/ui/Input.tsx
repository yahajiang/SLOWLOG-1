import type { InputHTMLAttributes } from "react"

export type InputSize = "sm" | "md" | "lg"
export type InputTone = "admin" | "front"

// 输入框的唯一实现。两轴拆开：size 管密度（sm 编辑行内 / md 后台常规 / lg 登录与整页表单），
// tone 管配色来源（admin 走 --dash-*，front 走前台 --yh-* 边 + 卡面底）。
// 同时导出 inputCls()：不便换成 <Input> 的裸 <input> 也能引用同一份定义。
const SIZES: Record<InputSize, string> = {
  sm: "px-2.5 py-1.5 text-sm min-h-[36px]",
  md: "px-3 py-2 text-[13px] min-h-[36px]",
  lg: "px-4 py-3 text-base min-h-[48px]",
}

const TONES: Record<InputTone, string> = {
  admin: "border-[var(--dash-border)] bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:ring-[var(--dash-accent)]/20 placeholder:text-[var(--dash-muted)]",
  front: "border-[var(--yh-border)] bg-[var(--dash-card)] focus:border-[var(--yh-accent)] focus:ring-[var(--yh-accent)]/20 placeholder:text-[var(--yh-muted)]",
}

const BASE =
  "w-full rounded-none border transition-colors focus:outline-none focus:ring-1 disabled:opacity-50"

export function inputCls(size: InputSize = "md", tone: InputTone = "admin", extra = ""): string {
  return [BASE, SIZES[size], TONES[tone], extra.trim()].filter(Boolean).join(" ")
}

export function Input({
  className = "",
  size = "md",
  tone = "admin",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & { size?: InputSize; tone?: InputTone }) {
  return <input className={inputCls(size, tone, className)} {...props} />
}
