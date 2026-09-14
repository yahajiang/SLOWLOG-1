export interface PageConfig {
  layout: "standard" | "magazine" | "fullscreen"
  theme: "light" | "dark" | "system"
  primaryColor: string
  fontFamily: "sans" | "serif"
  backgroundColor: string
  maxWidth: "narrow" | "medium" | "wide"
  showTOC: boolean
}

export const DEFAULT_PAGE_CONFIG: PageConfig = {
  layout: "standard",
  theme: "system",
  primaryColor: "oklch(0.55 0.15 250)",
  fontFamily: "sans",
  backgroundColor: "#FFFFFF",
  maxWidth: "medium",
  showTOC: true,
}

/** 内容安全白名单：颜色（hex/rgb/hsl/oklch/color-mix/色名，禁 url 与分号花括号） */
export function safeColor(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined
  const s = v.trim()
  if (s.length > 64) return undefined
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s)) return s
  if (/^(rgba?|hsla?|oklch|color-mix)\(/i.test(s) && !/[;{}<>]/.test(s)) return s
  if (/^[a-zA-Z]+$/.test(s) && s.length <= 20) return s
  return undefined
}

/** 内容安全白名单：链接 href（http/https/mailto/tel/锚点/站内相对路径，禁 javascript: 等） */
export function safeHref(href: unknown): string | null {
  if (typeof href !== "string") return null
  const s = href.trim()
  if (!s) return null
  if (s.startsWith("#") || s.startsWith("/")) return s
  if (/^(https?:\/\/|mailto:|tel:)/i.test(s)) return s
  return null
}

/** 内容安全白名单：图片 src（http/https/站内相对/data:image，禁其他协议） */
export function safeImgSrc(src: unknown): string | null {
  if (typeof src !== "string") return null
  const s = src.trim()
  if (!s) return null
  if (s.startsWith("/")) return s
  if (/^https?:\/\//i.test(s)) return s
  if (/^data:image\/(png|jpe?g|webp|gif|avif|svg\+xml);/i.test(s)) return s
  return null
}

const PAGE_LAYOUTS = ["standard", "magazine", "fullscreen"]
const PAGE_THEMES = ["light", "dark", "system"]
const PAGE_FAMILIES = ["sans", "serif"]
const PAGE_WIDTHS = ["narrow", "medium", "wide"]

export function parsePageConfig(raw: unknown): PageConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_PAGE_CONFIG
  const o = raw as Record<string, unknown>
  // 白名单化：枚举字段不合法即回退默认；颜色字段经 safeColor 过滤——
  // 渲染端 style 注入只可能拿到白名单内的 CSS 颜色值
  return {
    layout: (PAGE_LAYOUTS as string[]).includes(o.layout as string) ? (o.layout as PageConfig["layout"]) : DEFAULT_PAGE_CONFIG.layout,
    theme: (PAGE_THEMES as string[]).includes(o.theme as string) ? (o.theme as PageConfig["theme"]) : DEFAULT_PAGE_CONFIG.theme,
    primaryColor: safeColor(o.primaryColor) || DEFAULT_PAGE_CONFIG.primaryColor,
    fontFamily: (PAGE_FAMILIES as string[]).includes(o.fontFamily as string) ? (o.fontFamily as PageConfig["fontFamily"]) : DEFAULT_PAGE_CONFIG.fontFamily,
    backgroundColor: safeColor(o.backgroundColor) || DEFAULT_PAGE_CONFIG.backgroundColor,
    maxWidth: (PAGE_WIDTHS as string[]).includes(o.maxWidth as string) ? (o.maxWidth as PageConfig["maxWidth"]) : DEFAULT_PAGE_CONFIG.maxWidth,
    showTOC: typeof o.showTOC === "boolean" ? o.showTOC : DEFAULT_PAGE_CONFIG.showTOC,
  }
}
