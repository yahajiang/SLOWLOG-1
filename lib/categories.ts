export const CATEGORIES = [
  "All",
  "Design",
  "Plugin",
  "Engineering",
  "Typography",
  "Frontend",
  "Snippet",
  "Life",
] as const;

export type Category = (typeof CATEGORIES)[number];
export type ContentCategory = Exclude<Category, "All">;

export const CATEGORY_LABEL: Record<ContentCategory, string> = {
  Design: "设计",
  Plugin: "插件",
  Engineering: "工程",
  Typography: "字体",
  Frontend: "前端",
  Snippet: "点滴",
  Life: "生活",
};

export const CATEGORY_COLORS: Record<string, string> = {
  Design: "bg-rose-50 text-rose-700 border border-rose-200",
  Plugin: "bg-violet-50 text-violet-700 border border-violet-200",
  Engineering: "bg-blue-50 text-blue-700 border border-blue-200",
  Typography: "bg-teal-50 text-teal-700 border border-teal-200",
  Frontend: "bg-amber-50 text-amber-700 border border-amber-200",
  Snippet: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Life: "bg-orange-50 text-orange-700 border border-orange-200",
};

export const ART_PALETTES: Record<string, { paper: string; ink: string; wash: string }> = {
  Design: { paper: "#F9F6F2", ink: "#A5576A", wash: "#EDE1E4" },
  Plugin: { paper: "#F4F3F8", ink: "#8B7BB0", wash: "#E8E4EF" },
  Engineering: { paper: "#F2F5F7", ink: "#6B8AB1", wash: "#DFE6EC" },
  Typography: { paper: "#F0F5F4", ink: "#5FA89F", wash: "#DDEBE9" },
  Frontend: { paper: "#F7F4EE", ink: "#C2A06A", wash: "#EDE5D5" },
  Snippet: { paper: "#F1F5F2", ink: "#6BA08A", wash: "#E0EDE8" },
  Life: { paper: "#F8F4EF", ink: "#C28A6A", wash: "#EDE1D5" },
};

export const AUTHOR_BG: Record<string, string> = {
  M: "bg-rose-100 text-rose-700",
  C: "bg-violet-100 text-violet-700",
  Y: "bg-amber-100 text-amber-700",
  D: "bg-blue-100 text-blue-700",
  R: "bg-emerald-100 text-emerald-700",
  J: "bg-orange-100 text-orange-700",
  N: "bg-teal-100 text-teal-700",
  P: "bg-pink-100 text-pink-700",
  A: "bg-zinc-100 text-zinc-700",
  S: "bg-sky-100 text-sky-700",
};
