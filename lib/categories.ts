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

/**
 * @deprecated 已同源化至 ART_PALETTES，请用 getCategoryBadgeStyle 或 ART_PALETTES[category] 直接取 paper/wash/ink
 * 保留仅为兼容旧引用，实际样式由 CategoryBadge 内联 paper/wash/ink 统一
 */
export const CATEGORY_COLORS: Record<string, string> = {
  Design: "bg-rose-50 text-rose-700 border border-rose-200",
  Plugin: "bg-violet-50 text-violet-700 border border-violet-200",
  Engineering: "bg-blue-50 text-blue-700 border border-blue-200",
  Typography: "bg-teal-50 text-teal-700 border border-teal-200",
  Frontend: "bg-amber-50 text-amber-700 border border-amber-200",
  Snippet: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Life: "bg-orange-50 text-orange-700 border border-orange-200",
};

export function getCategoryBadgeStyle(category: string): Record<string, string> {
  const p = (ART_PALETTES as any)[category];
  if (!p) return {};
  return { backgroundColor: p.paper, color: p.ink, borderColor: p.wash, borderWidth: "1px", borderStyle: "solid" };
}

export const ART_PALETTES: Record<string, { paper: string; ink: string; wash: string; accent: string }> = {
  Design: { paper: "#F5F3EF", ink: "#3A332E", wash: "#E8E0D8", accent: "#C9A98A" },
  Plugin: { paper: "#EEF2EE", ink: "#2E3A35", wash: "#DDE3DE", accent: "#7AA88A" },
  Engineering: { paper: "#EAF0F5", ink: "#30333A", wash: "#D6DEE8", accent: "#7A9CC2" },
  Typography: { paper: "#F5F1E8", ink: "#3C3830", wash: "#E8E0D0", accent: "#C2A87A" },
  Frontend: { paper: "#FFF7E8", ink: "#3A3330", wash: "#F0E0C0", accent: "#E8A46A" },
  Snippet: { paper: "#E8F3E8", ink: "#30362E", wash: "#C8DCC8", accent: "#7AB088" },
  Life: { paper: "#FDF0E6", ink: "#3A3330", wash: "#F0DCCA", accent: "#E8A07A" },
};


export const CAT_ABBR: Record<string, string> = {
  Design: "DSN",
  Plugin: "PLG",
  Engineering: "ENG",
  Typography: "TYP",
  Frontend: "FRT",
  Snippet: "SNP",
  Life: "LIFE",
};

export type TagSymbol = "grid" | "shield" | "doubleCircle" | "wave" | "diamond" | "window" | "hex" | "circle";

// 功能优先 + 技术回退：主标签决定符号形态（扩展至 ~20 键，覆盖 Soulsync 6 分支 + 通用标签）
export const TAG_SYMBOL_MAP: Record<string, TagSymbol> = {
  // 功能 — 菜单 / 生成
  menu: "grid", 菜单: "grid", pillow: "grid", 单: "grid", image: "grid",
  // 功能 — 防护 / 安全
  shield: "shield", 防护: "shield", 注入: "shield", 安全: "shield", injection: "shield",
  // 功能 — 镜像 / 自我
  mirror: "doubleCircle", 镜像: "doubleCircle", 自我: "doubleCircle", self: "doubleCircle",
  // 功能 — 小馆 / 美食 / 食谱
  bistro: "wave", 小馆: "wave", 美食: "wave", 菜谱: "wave", recipe: "wave",
  // 功能 — 心旅 / 情绪 / 启明
  soulsync: "diamond", 心旅: "diamond", 启明: "diamond", 心境: "diamond", 心: "diamond", emotion: "diamond", 情绪: "diamond", soul: "diamond",
  // 技术 — 打印
  print: "window", 打印: "window", assistant: "window",
  // 技术 — Python / AstrBot / 通用
  python: "circle", astrbot: "circle", bot: "circle", llm: "circle", ai: "circle",
  // 技术 — 架构 / 引擎
  engineering: "hex", 架构: "hex", 引擎: "hex", arch: "hex",
  // 生活 / 时间线 / 随想
  life: "wave", 生活: "wave", 随想: "wave", timeline: "wave",
  // 设计 / 排版 / 字体
  design: "grid", 设计: "grid", typography: "grid", 字体: "grid",
  // 前端 / Web / 组件
  frontend: "hex", 前端: "hex", web: "hex", component: "hex",
  // 代码片段 / 工具
  snippet: "shield", 代码: "shield", tool: "shield", utility: "shield",
  // 安全防护（插件子分支）
  security: "shield",
};

export function resolveTagSymbol(tags: string[] | undefined): TagSymbol | null {
  if (!tags || tags.length === 0) return null;
  for (const raw of tags) {
    const key = raw.trim().toLowerCase();
    // 精确命中
    if (TAG_SYMBOL_MAP[key]) return TAG_SYMBOL_MAP[key];
    // 模糊包含：中文/英文部分匹配
    for (const [k, v] of Object.entries(TAG_SYMBOL_MAP)) {
      if (key.includes(k.toLowerCase()) || k.toLowerCase().includes(key)) return v;
    }
  }
  return null;
}

// 标签 → 主体场景（8 主符号各 1 个独立 SVG 视觉），分类定色与骨架、标签定场景
export const TAG_SCENE: Record<TagSymbol, string[]> = {
  // 菜单/生成：2×2 田字格 + 像素扩散
  grid: ["menu", "菜单", "image", "design", "pillow", "typography", "字体"],
  // 防护：盾形 + 注入箭头被挡
  shield: ["shield", "防护", "注入", "安全", "snippet", "代码", "tool"],
  // 镜像：双圆叠影 + 反射波
  doubleCircle: ["mirror", "镜像", "自我"],
  // 小馆/美食/生活：层状美食 + 蒸汽 + 杯
  wave: ["bistro", "小馆", "美食", "菜谱", "life", "生活", "随想"],
  // 心旅/情绪/启明：菱形 + 中心点 + 放射线
  diamond: ["soulsync", "心旅", "启明", "心境", "心", "emotion", "情绪"],
  // 打印：窗口 + 纸出来
  window: ["print", "打印", "assistant"],
  // 架构/工程/前端：六边 + 内部连点
  hex: ["engineering", "架构", "引擎", "frontend", "前端", "web", "component"],
  // Python/AstrBot/通用：同心圆 + 中心点
  circle: ["python", "astrbot", "bot", "llm", "ai"],
};

// 解析首个标签的场景符号（已有 resolveTagSymbol），这里返回主标签字符串本身
export function resolveTagPrimary(tags: string[] | undefined): string | null {
  if (!tags || tags.length === 0) return null;
  return tags[0]?.trim() ?? null;
}

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
