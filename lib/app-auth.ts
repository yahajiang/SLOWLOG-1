import { createHash } from "node:crypto"
import type { NextRequest } from "next/server"
import type { Session } from "next-auth"
import { apiError } from "./api-utils"
import { prisma } from "./prisma"
import { auth } from "./auth"

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex")
}

// ── 令牌用途分级（2026-09-21）────────────────────────────────────
//
// 起因：App 里「邮箱 + 密码自动获取 Token」这条路，本意只是让读者端能拿到
// 含正文/草稿的同步数据；但那时全项目只有**一种**令牌，后台写接口
// （posts / settings / media / app/tokens…）同样只看「令牌是否有效」，
// 于是同一枚存在手机上的长期令牌既是只读同步凭据、又是后台管理凭据。
//
// 现在按用途签发两枚：`sync` 只能读同步内容，`admin` 才能碰后台写接口。
// 判定只在本文件里做，路由一律调用 requireAdminAuth / requireSessionOrBearer，
// **不得自行比较 scope 字符串**（散落比较 = 迟早漏掉一处）。

/** 只读同步：`/api/app/sync`、草稿封面、推送设备注册。 */
export const TOKEN_SCOPE_SYNC = "sync"

/** 后台管理：文章/分类/随想/设置/媒体/令牌管理/改密。 */
export const TOKEN_SCOPE_ADMIN = "admin"

export type TokenScope = typeof TOKEN_SCOPE_SYNC | typeof TOKEN_SCOPE_ADMIN

export function isTokenScope(v: unknown): v is TokenScope {
  return v === TOKEN_SCOPE_SYNC || v === TOKEN_SCOPE_ADMIN
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * 同步令牌 90 天、管理令牌 7 天。
 *
 * 两者刻意不对称：同步令牌要长期存在手机上（离线阅读不该反复要密码），
 * 而管理令牌能改写站点，暴露窗口必须小得多。到期后 App 会引导重新验证
 * 一次邮箱密码 —— 对用户是无感的，对泄露的旧凭据却是硬停。
 */
export const SYNC_TOKEN_TTL_MS = 90 * DAY_MS
export const ADMIN_TOKEN_TTL_MS = 7 * DAY_MS

export function tokenTtlMs(scope: TokenScope): number {
  return scope === TOKEN_SCOPE_ADMIN ? ADMIN_TOKEN_TTL_MS : SYNC_TOKEN_TTL_MS
}

/** 计算到期时间。`from` 可注入，便于测试与迁移脚本。 */
export function tokenExpiry(scope: TokenScope, from: Date = new Date()): Date {
  return new Date(from.getTime() + tokenTtlMs(scope))
}

// ── Bearer 解析 ─────────────────────────────────────────────────

/**
 * 解析失败的原因。**必须区分开**，否则上层给不出准确的状态码：
 * 「没带凭据」是 401，而「带的是同步凭据」是 403 —— 后者重试一万次
 * 也不会变成 403 以外的结果，客户端据此应该换凭据而不是重试。
 */
export type BearerFailure = "missing" | "invalid" | "expired"

export type BearerLookup =
  | { ok: true; tokenId: string; scope: string }
  | { ok: false; reason: BearerFailure }

/**
 * 解析 `Authorization: Bearer <plain>` → SHA-256 → 查 `ApiToken`。
 * 命中且未撤销、未过期时 fire-and-forget 更新 `lastUsedAt`。
 */
export async function lookupBearer(req: Request): Promise<BearerLookup> {
  const header = req.headers.get("authorization") || req.headers.get("Authorization") || ""
  const m = /^Bearer\s+(.+)$/i.exec(header.trim())
  if (!m) return { ok: false, reason: "missing" }
  const plain = m[1].trim()
  if (!plain || plain.length < 16 || plain.length > 256) return { ok: false, reason: "invalid" }
  const tokenHash = sha256Hex(plain)
  try {
    const row = await prisma.apiToken.findUnique({ where: { tokenHash } })
    if (!row || row.revokedAt) return { ok: false, reason: "invalid" }
    // 过期判定放在撤销之后：过期的令牌不再刷新 lastUsedAt，
    // 否则「最近使用」会显示出早已失效的凭据。
    if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
      return { ok: false, reason: "expired" }
    }
    void prisma.apiToken
      .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {})
    return { ok: true, tokenId: row.id, scope: row.scope }
  } catch {
    return { ok: false, reason: "invalid" }
  }
}

/**
 * 旧签名（有效即返回，失效一律 `null`）。
 * 供 `/api/app/sync`、`/api/covers/[id]` 这类**只读**路径使用 ——
 * 它们不关心用途，只关心「这枚凭据能不能解锁完整内容」。
 */
export async function bearerToken(
  req: Request,
): Promise<{ ok: true; tokenId: string; scope: string } | null> {
  const r = await lookupBearer(req)
  return r.ok ? r : null
}

// ── 门禁 ───────────────────────────────────────────────────────

export type SessionOrBearer =
  | { kind: "session"; session: Session }
  | { kind: "bearer"; tokenId: string }

/**
 * **同步侧**门禁：Cookie 会话优先，其次任意有效 Bearer（sync 或 admin 都可）。
 * 强制改密仅作用于 session（Token 由改密后的管理员创建）。
 */
export async function requireSessionOrBearer(req: NextRequest | Request): Promise<SessionOrBearer | null> {
  const session = await auth()
  if (session) return { kind: "session", session: session as Session }
  const bearer = await bearerToken(req)
  if (bearer) return { kind: "bearer", tokenId: bearer.tokenId }
  return null
}

export type AdminAuth =
  | { ok: true; kind: "session"; session: Session }
  | { ok: true; kind: "bearer"; tokenId: string }
  | { ok: false; reason: BearerFailure | "scope" }

/**
 * **后台管理**门禁：Cookie 会话，或 `scope = admin` 的 Bearer。
 *
 * 它比 [requireSessionOrBearer] 严一档，正是本次改动的落点：
 * 邮箱密码自动获取的那枚（`sync`）到这里会被 403 挡住，
 * 而不是像以前那样畅通无阻。
 *
 * Web 网页端的 Cookie 会话不需要 scope —— 浏览器登录本就是管理入口。
 */
export async function requireAdminAuth(req: NextRequest | Request): Promise<AdminAuth> {
  const session = await auth()
  if (session) return { ok: true, kind: "session", session: session as Session }
  const bearer = await lookupBearer(req)
  if (!bearer.ok) return { ok: false, reason: bearer.reason }
  if (bearer.scope !== TOKEN_SCOPE_ADMIN) return { ok: false, reason: "scope" }
  return { ok: true, kind: "bearer", tokenId: bearer.tokenId }
}

/**
 * 门禁失败 → 统一错误响应。路由里只需一行：
 * ```ts
 * const gate = await requireAdminAuth(req)
 * if (!gate.ok) return adminAuthError(gate.reason)
 * ```
 *
 * ## 为什么四种原因要分成 401 / 403 两种状态码
 * - `missing` / `invalid` / `expired` → **401**：凭据本身有问题，重新验证能解决；
 * - `scope` → **403**：凭据完全有效，只是**用途**不对。客户端重试一万次
 *   也不会变成 200，必须换一枚管理凭据 —— 这一条正是本次分级改动的意义所在。
 *
 * 响应同时带 `code`（`token_expired` / `token_scope` / …）供客户端分支，
 * 带 `error` 中文供直接展示。二者不可互相替代：文案会改，code 是契约。
 */
export function adminAuthError(reason: BearerFailure | "scope") {
  switch (reason) {
    case "missing":
      return apiError(401, "未登录", "unauthenticated")
    case "expired":
      return apiError(401, "管理凭据已过期，请重新验证", "token_expired")
    case "scope":
      return apiError(403, "该凭据只能用于内容同步，不能用于后台管理", "token_scope")
    default:
      return apiError(401, "登录状态已失效，请重新登录", "unauthenticated")
  }
}

/**
 * **同步侧**凭据失败 → 错误响应。
 *
 * 与 [adminAuthError] 的**语义完全相同**（`missing`/`invalid`/`expired` → 401，
 * 客户端重新获取凭据即可解决），差别只在文案：这里的凭据是「内容同步凭据」，
 * 说成「管理凭据」会让读者端看到牛头不对马嘴的提示。
 *
 * ⚠️ 它的存在是为了让 `/api/app/sync` **不要**在凭据被拒时降级成游客数据 ——
 * 游客 payload 不含 `content`，而 App 侧 Room `@Upsert` 是整行替换，
 * 降级会把本地已同步的正文覆盖成 NULL（详见该路由的注释）。
 */
export function syncAuthError(reason: BearerFailure) {
  switch (reason) {
    case "missing":
      return apiError(401, "未登录", "unauthenticated")
    case "expired":
      return apiError(401, "同步凭据已过期，请重新获取", "token_expired")
    default:
      return apiError(401, "同步凭据已失效，请重新获取", "unauthenticated")
  }
}
