export const CATEGORIES = [
  "All",
  "Design",
  "Plugin",
  "Engineering",
  "Typography",
  "Frontend",
  "Snippet",
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
};

export const CATEGORY_COLORS: Record<ContentCategory, string> = {
  Design: "bg-rose-50 text-rose-700 border border-rose-200",
  Plugin: "bg-violet-50 text-violet-700 border border-violet-200",
  Engineering: "bg-blue-50 text-blue-700 border border-blue-200",
  Typography: "bg-teal-50 text-teal-700 border border-teal-200",
  Frontend: "bg-amber-50 text-amber-700 border border-amber-200",
  Snippet: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

export const ART_PALETTES: Record<
  ContentCategory,
  { paper: string; ink: string; wash: string }
> = {
  Design: { paper: "#FAF7F2", ink: "#9F1239", wash: "#FBE3E8" },
  Plugin: { paper: "#F5F3FF", ink: "#7C3AED", wash: "#EDE9FE" },
  Engineering: { paper: "#F4F7FA", ink: "#1D4ED8", wash: "#DBEAFE" },
  Typography: { paper: "#F0FDFD", ink: "#0F766E", wash: "#CCFBF1" },
  Frontend: { paper: "#FAF6EE", ink: "#B45309", wash: "#FDE9C8" },
  Snippet: { paper: "#F2F8F4", ink: "#047857", wash: "#D1FAE5" },
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
