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

// ── 账号角色（2026-09-25）───────────────────────────────────────
//
// 起因：App 的「邮箱 + 密码自动获取令牌」要能在没有账号时自助注册，
// 但 `User` 表原本没有任何角色区分 —— 一条 User 记录就等于 Web 后台管理员。
// 直接放开注册等于把整站写权限交给任意路人，所以先分角色，再谈注册。
//
// 判定只在本文件里做（与 scope 同一条规矩）：路由一律调用 requireAdminAuth /
// canReadUnpublished，**不得自行比较 role 字符串**。
//
// ⚠️ 两条「历史凭据」规则，都是为了让部署那一刻不把作者锁在门外：
//   - `ApiToken.userId == null` 的令牌 = 本次改动之前签发的 = 作者本人；
//   - 会话里没有 `role`（JWT 是改动前签发的）= 同上。
// 两者都按 admin 处理。新签发的令牌与新登录会话一定带值，reader 因此不可能获益。

/** 站点作者：可进后台、可换管理令牌、同步时能拿到草稿。 */
export const ROLE_ADMIN = "admin"

/** App 自助注册的只读账号：只能同步已发布内容，进不了后台。 */
export const ROLE_READER = "reader"

export type UserRole = typeof ROLE_ADMIN | typeof ROLE_READER

export function isUserRole(v: unknown): v is UserRole {
  return v === ROLE_ADMIN || v === ROLE_READER
}

/**
 * 这个身份能不能看到**未发布**内容（草稿 / 定时 / 已下架）。
 *
 * `role` 传 `null` 表示「历史凭据，归属未知」⇒ 按作者处理（见上文）。
 * 只有明确是 reader 才收窄。
 */
export function canReadUnpublished(role: string | null | undefined): boolean {
  return role !== ROLE_READER
}

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
  | {
      ok: true
      tokenId: string
      scope: string
      /** 归属账号；null = 本次改动之前签发的历史令牌（按作者处理）。 */
      userId: string | null
      /** 归属账号的角色；null 同上。 */
      role: string | null
    }
  | { ok: false; reason: BearerFailure }

/**
 * 解析 `Authorization: Bearer <plain>` → SHA-256 → 查 `ApiToken`（连带归属账号）。
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
    const row = await prisma.apiToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { role: true } } },
    })
    if (!row || row.revokedAt) return { ok: false, reason: "invalid" }
    // 过期判定放在撤销之后：过期的令牌不再刷新 lastUsedAt，
    // 否则「最近使用」会显示出早已失效的凭据。
    if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
      return { ok: false, reason: "expired" }
    }
    void prisma.apiToken
      .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {})
    return {
      ok: true,
      tokenId: row.id,
      scope: row.scope,
      userId: row.userId,
      role: row.user?.role ?? null,
    }
  } catch {
    return { ok: false, reason: "invalid" }
  }
}

/**
 * 旧签名（有效即返回，失效一律 `null`）。
 * 供 `/api/app/sync`、`/api/covers/[id]` 这类**只读**路径使用 ——
 * 它们不关心用途，只关心「这枚凭据是谁的、能看到多少内容」。
 */
export async function bearerToken(
  req: Request,
): Promise<Extract<BearerLookup, { ok: true }> | null> {
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
  | {
      ok: true
      kind: "bearer"
      tokenId: string
      /** 这枚管理令牌的归属账号；null = 历史令牌（改动前签发，当时没有归属字段）。 */
      userId: string | null
    }
  | { ok: false; reason: BearerFailure | "scope" | "role" }

/** 会话里有没有后台管理权限。缺 role = 本次改动之前签发的 JWT ⇒ 按作者处理。 */
export function sessionIsAdmin(session: Session | null | undefined): boolean {
  return canReadUnpublished((session?.user as { role?: string } | undefined)?.role)
}

/**
 * **后台管理**门禁：Cookie 会话（且账号是 admin），或 `scope = admin` 的 Bearer
 * （且归属账号是 admin）。
 *
 * 它比 [requireSessionOrBearer] 严两档，分别对应两次改动：
 * - **scope**（2026-09-21）：邮箱密码自动获取的那枚（`sync`）在这里被 403 挡住；
 * - **role**（2026-09-25）：App 自助注册的 `reader` 账号，即使误拿到管理用途的
 *   令牌也进不来。签发处已经拦了一道，这里是第二道 —— 权限判定宁可重复，
 *   不可只有一处且那处漏了。
 */
export async function requireAdminAuth(req: NextRequest | Request): Promise<AdminAuth> {
  const session = await auth()
  if (session) {
    if (!sessionIsAdmin(session as Session)) return { ok: false, reason: "role" }
    return { ok: true, kind: "session", session: session as Session }
  }
  const bearer = await lookupBearer(req)
  if (!bearer.ok) return { ok: false, reason: bearer.reason }
  if (bearer.scope !== TOKEN_SCOPE_ADMIN) return { ok: false, reason: "scope" }
  if (!canReadUnpublished(bearer.role)) return { ok: false, reason: "role" }
  return { ok: true, kind: "bearer", tokenId: bearer.tokenId, userId: bearer.userId }
}

/**
 * 门禁失败 → 统一错误响应。路由里只需一行：
 * ```ts
 * const gate = await requireAdminAuth(req)
 * if (!gate.ok) return adminAuthError(gate.reason)
 * ```
 *
 * ## 为什么这些原因要分成 401 / 403 两种状态码
 * - `missing` / `invalid` / `expired` → **401**：凭据本身有问题，重新验证能解决；
 * - `scope` / `role` → **403**：凭据完全有效，只是**用途**或**账号权限**不对。
 *   客户端重试一万次也不会变成 200，必须换凭据或换账号 —— 这一条正是分级改动的意义所在。
 *
 * 响应同时带 `code`（`token_expired` / `token_scope` / …）供客户端分支，
 * 带 `error` 中文供直接展示。二者不可互相替代：文案会改，code 是契约。
 */
export function adminAuthError(reason: BearerFailure | "scope" | "role") {
  switch (reason) {
    case "missing":
      return apiError(401, "未登录", "unauthenticated")
    case "expired":
      return apiError(401, "管理凭据已过期，请重新验证", "token_expired")
    case "scope":
      return apiError(403, "该凭据只能用于内容同步，不能用于后台管理", "token_scope")
    case "role":
      // 与 scope 同为 403：凭据本身没毛病，是**这个账号**没有管理权限。
      // 重试、换设备、重新登录都不会变，只有把账号提成 admin 才行。
      return apiError(403, "该账号是只读账号，没有后台管理权限", "forbidden_role")
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
