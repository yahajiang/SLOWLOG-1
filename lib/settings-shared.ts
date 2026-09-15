/**
 * 站点设置的**共享层**：类型 + 默认值。刻意与 lib/settings.ts（prisma 查询）分离——
 * SettingsProvider/Header/Footer 等 client 组件只允许 import 本文件，
 * 一旦引入 prisma 会把 pg 拖进客户端 bundle。
 */

export interface SocialLink {
  name: string
  url: string
}

export interface SiteSettings {
  siteName: string
  siteNameEn: string | null
  siteDescription: string
  siteDescriptionEn: string | null
  siteKeywords: string
  siteIconUrl: string | null
  logoUrl: string | null
  footerText: string | null
  footerTextEn: string | null
  socialLinks: SocialLink[]
  defaultPageConfig: unknown
  postsPerPage: number
  theme: string
}

/** 与 prisma/schema.prisma 的 Setting 默认值保持一致（单例未落库时的只读兜底） */
export const SETTINGS_DEFAULTS: SiteSettings = {
  siteName: "慢日志",
  siteNameEn: "SlowLog",
  siteDescription: "慢下来，写点值得读的东西。",
  siteDescriptionEn: null,
  siteKeywords: "设计,博客,思考",
  siteIconUrl: null,
  logoUrl: null,
  footerText: null,
  footerTextEn: null,
  socialLinks: [],
  defaultPageConfig: {
    layout: "standard",
    theme: "light",
    primaryColor: "oklch(0.55 0.15 250)",
    fontFamily: "sans",
    backgroundColor: "#FFFFFF",
    maxWidth: "medium",
    showTOC: false,
  },
  postsPerPage: 10,
  theme: "system",
}
