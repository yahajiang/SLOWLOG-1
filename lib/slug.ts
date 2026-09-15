/**
 * 全站唯一 slug 生成规则（修复 P0-1）。
 *
 * 背景：旧实现用 `title.toLowerCase().replace(/[^\w]+/g, "-")` 兜底，
 * 而 `\w` 等价于 `[A-Za-z0-9_]`，**不包含中文**——纯中文标题会被整串
 * 压成单个 `"-"`，两篇文章必然撞 `Post.slug @unique`，第 2 篇起
 * 恒定返回 400「Slug 已存在」。
 *
 * 规则：
 *  1. `slugify()` 是纯同步规则，无外部依赖，服务端与客户端可共用；
 *  2. `slugFromTitle()` 在含中文时先转拼音（pinyin-pro 动态引入，
 *     避免进入客户端 bundle），并以时间戳兜底保证**永远非空且唯一**。
 */

/** 纯规则转换：可能返回空串（如标题全为符号），调用方需自行兜底 */
export function slugify(input: string, maxLen = 120): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "") // 去除非字母数字/空白/连字符
    .trim()
    .replace(/[\s_]+/g, "-") // 空白与下划线 → 连字符
    .replace(/-+/g, "-") // 折叠连续连字符
    .replace(/^-+|-+$/g, "") // 去首尾连字符
    .slice(0, maxLen)
    .replace(/-+$/, "") // 截断后可能留下尾部连字符，再清理一次
}

/**
 * 兜底 slug：纯时间戳在同一毫秒内会重复（批量创建/脚本导入时可能触发），
 * 追加 36 进制随机后缀确保唯一。输出形如 `post-mf8k2x9a3b`。
 */
function fallbackSlug(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/**
 * 由标题生成唯一 slug：中文段转拼音，结果保证非空（兜底时间戳+随机）。
 * 仅服务端调用——pinyin-pro 通过动态 import 加载。
 */
export async function slugFromTitle(title: string, prefix = "post"): Promise<string> {
  const t = (title || "").trim()
  if (!t) return fallbackSlug(prefix)

  let base = t
  if (/[\u4e00-\u9fa5]/.test(t)) {
    try {
      const { pinyin } = await import("pinyin-pro")
      // 只替换中文段，保留英文/数字原文，避免 "Hello 世界" 被整体音译
      base = t.replace(/[\u4e00-\u9fa5]+/g, (m) =>
        pinyin(m, { toneType: "none", type: "array" }).join("-")
      )
    } catch {
      // pinyin 不可用时退回原串，仍由下方兜底保证非空
    }
  }

  return slugify(base) || fallbackSlug(prefix)
}
