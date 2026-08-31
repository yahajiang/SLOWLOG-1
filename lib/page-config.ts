export interface PageConfig {
  layout: "standard" | "magazine" | "fullscreen"
  theme: "light" | "dark"
  primaryColor: string
  fontFamily: "sans" | "serif"
  backgroundColor: string
  maxWidth: "narrow" | "medium" | "wide"
  showTOC: boolean
}

export const DEFAULT_PAGE_CONFIG: PageConfig = {
  layout: "standard",
  theme: "light",
  primaryColor: "oklch(0.55 0.15 250)",
  fontFamily: "sans",
  backgroundColor: "#FFFFFF",
  maxWidth: "medium",
  showTOC: false,
}

export function parsePageConfig(raw: unknown): PageConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_PAGE_CONFIG
  const o = raw as Record<string, unknown>
  return {
    layout: (o.layout as PageConfig["layout"]) || DEFAULT_PAGE_CONFIG.layout,
    theme: (o.theme as PageConfig["theme"]) || DEFAULT_PAGE_CONFIG.theme,
    primaryColor: (o.primaryColor as string) || DEFAULT_PAGE_CONFIG.primaryColor,
    fontFamily: (o.fontFamily as PageConfig["fontFamily"]) || DEFAULT_PAGE_CONFIG.fontFamily,
    backgroundColor: (o.backgroundColor as string) || DEFAULT_PAGE_CONFIG.backgroundColor,
    maxWidth: (o.maxWidth as PageConfig["maxWidth"]) || DEFAULT_PAGE_CONFIG.maxWidth,
    showTOC: typeof o.showTOC === "boolean" ? o.showTOC : DEFAULT_PAGE_CONFIG.showTOC,
  }
}
