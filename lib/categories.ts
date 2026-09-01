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
  Design: { paper: "#F5F3EF", ink: "#3A332E", wash: "#E8E0D8" },
  Plugin: { paper: "#F0F2F0", ink: "#2E3A35", wash: "#DDE3DE" },
  Engineering: { paper: "#F2F3F5", ink: "#30333A", wash: "#E0E3E6" },
  Typography: { paper: "#F5F4F0", ink: "#3C3830", wash: "#E8E6E0" },
  Frontend: { paper: "#F6F3F0", ink: "#3A3330", wash: "#E8E2DC" },
  Snippet: { paper: "#F3F4F3", ink: "#30362E", wash: "#E0E3E0" },
  Life: { paper: "#F5F2EF", ink: "#3A3330", wash: "#E8E2DC" },
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
