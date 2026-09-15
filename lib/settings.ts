import { prisma } from "./prisma"
import { unstable_cache } from "next/cache"
import { SETTINGS_DEFAULTS, type SiteSettings, type SocialLink } from "./settings-shared"

// 供 API 层（如 GET /api/settings 的只读兜底）复用同一份默认值
export { SETTINGS_DEFAULTS } from "./settings-shared"
export type { SiteSettings, SocialLink } from "./settings-shared"

/**
 * 站点设置 · 服务端唯一来源（后端审查补全：设置表 12 个业务字段此前仅
 * siteName 有消费痕迹，其余「只存不用」——Header/Footer/metadata 全硬编码）。
 *
 * - getSettings()：unstable_cache 包裹（60s / tags:["settings"]），
 *   PUT /api/settings 成功后 revalidateTag("settings") 立即失效；
 * - DB 不可达或单例未初始化时回退默认值——设置属装饰性数据，
 *   降级语义正确（品牌名有默认），不应让 DB 抖动挂掉全站布局
 *   （与 lib/posts.ts 的内容查询策略刻意不同：内容为空=伪装无内容不可接受，
 *    设置为默认值=品牌名仍成立）。
 * - 仅 Node runtime（依赖 prisma）：middleware/edge 不得 import；
 *   client 组件只允许 import lib/settings-shared.ts（类型与默认值）。
 */

/** socialLinks 容错归一：DB 里是 Json，形态不可信，逐项白名单化 */
function normalizeSocialLinks(raw: unknown): SocialLink[] {
  if (!Array.isArray(raw)) return SETTINGS_DEFAULTS.socialLinks
  return raw
    .filter(
      (x): x is { name: unknown; url: unknown } =>
        !!x && typeof x === "object" &&
        typeof (x as Record<string, unknown>).name === "string" &&
        typeof (x as Record<string, unknown>).url === "string"
    )
    .map((x) => ({
      name: String(x.name).slice(0, 30),
      url: String(x.url).slice(0, 500),
    }))
    .filter((x) => x.name.trim() && /^https?:\/\//i.test(x.url))
    .slice(0, 10)
}

export const getSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      const row = await prisma.setting.findUnique({ where: { id: "singleton" } })
      if (!row) return SETTINGS_DEFAULTS
      return {
        siteName: row.siteName || SETTINGS_DEFAULTS.siteName,
        siteNameEn: row.siteNameEn,
        siteDescription: row.siteDescription || SETTINGS_DEFAULTS.siteDescription,
        siteDescriptionEn: row.siteDescriptionEn,
        siteKeywords: row.siteKeywords || SETTINGS_DEFAULTS.siteKeywords,
        siteIconUrl: row.siteIconUrl,
        logoUrl: row.logoUrl,
        footerText: row.footerText,
        footerTextEn: row.footerTextEn,
        socialLinks: normalizeSocialLinks(row.socialLinks),
        defaultPageConfig: row.defaultPageConfig,
        postsPerPage: row.postsPerPage,
        theme: row.theme,
      }
    } catch {
      return SETTINGS_DEFAULTS
    }
  },
  ["site-settings"],
  { revalidate: 60, tags: ["settings"] }
)
