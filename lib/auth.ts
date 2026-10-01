import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth-config"
import { normalizeLoginEmail } from "./login-shared"

// 默认账户判定：邮箱可以公开（README 里就写着），但**初始口令不再有明文兜底**——
// 只有部署方在 env 里显式给了 AUTH_DEFAULT_PASSWORD，才可能命中判定。
const DEFAULT_EMAIL = process.env.AUTH_DEFAULT_EMAIL || "admin@slowlog.dev"
const DEFAULT_PASSWORD = process.env.AUTH_DEFAULT_PASSWORD || ""

// ── 登录防护（P1-2 重做）─────────────────────────────────────────
// 旧实现：按 email 硬锁 5 次 / 15 分钟。两个问题：
//   ① 攻击者无需知道密码，只要对已知管理员邮箱（README 公开）连打 5 次错误密码，
//      就能让真实管理员 15 分钟进不去 —— 限流器本身成了 DoS 工具；
//   ② 清理只在 size>100 时执行且仅删过期项，而窗口内的失败项永不过期，
//      于是每次 recordFail 都要全表遍历 → 表无上界增长 + CPU 放大。
//
// 现在：
//   ① 双维度计数：IP 为主闸（防跨账户滥用），email 为辅（防定向爆破）；
//   ② 超阈值改为**渐进延迟**，正确凭据始终可以登录 → DoS 面关闭；
//   ③ 只对"异常高频"来源硬拒（阈值远高于正常用户行为），保留最终防线；
//   ④ 表容量固定，超限时按时间戳批量淘汰最旧一半，单次操作摊销 O(1)。
//
// ⚠️ serverless 内存为实例级——多实例部署下限流按实例生效，仍显著提高暴力成本。
const IP_DELAY_THRESHOLD = 10 // 同一来源开始延迟
const IP_HARD_LIMIT = 30 // 同一来源直接拒绝（正常用户绝不会触及）
const EMAIL_DELAY_THRESHOLD = 5 // 同一账号开始延迟
const WINDOW_MS = 15 * 60 * 1000
const MAX_ENTRIES = 2000
const MAX_DELAY_MS = 3000

type FailRec = { count: number; firstFailAt: number }
const failTable = new Map<string, FailRec>()

/** 超容量时批量淘汰最旧的一半，避免每次写入都做全表扫描 */
function pruneIfNeeded() {
  if (failTable.size <= MAX_ENTRIES) return
  const victims = [...failTable.entries()]
    .sort((a, b) => a[1].firstFailAt - b[1].firstFailAt)
    .slice(0, Math.floor(MAX_ENTRIES / 2))
  for (const [k] of victims) failTable.delete(k)
}

function failCount(key: string, now: number): number {
  const rec = failTable.get(key)
  if (!rec) return 0
  if (now - rec.firstFailAt > WINDOW_MS) {
    failTable.delete(key)
    return 0
  }
  return rec.count
}

function recordFail(key: string, now: number) {
  const rec = failTable.get(key)
  if (!rec || now - rec.firstFailAt > WINDOW_MS) failTable.set(key, { count: 1, firstFailAt: now })
  else rec.count++
  pruneIfNeeded()
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 客户端 IP：取 x-forwarded-for 首段（与 app/api/posts/[id]/view/route.ts 同一取法） */
function clientIp(request?: Request): string {
  const h = request?.headers
  if (!h) return "unknown"
  const xff = h.get("x-forwarded-for")?.split(",")[0]?.trim()
  return xff || h.get("x-real-ip")?.trim() || "unknown"
}

/**
 * 渐进退避：失败越多等待越久，但**不阻断**正确凭据。
 * 这既显著提高暴力破解成本，又不会被攻击者反过来当作锁死管理员的工具。
 */
async function applyBackoff(ipKey: string, emailKey: string, now: number) {
  const overIp = failCount(ipKey, now) - IP_DELAY_THRESHOLD
  const overEmail = failCount(emailKey, now) - EMAIL_DELAY_THRESHOLD
  const over = Math.max(overIp, overEmail)
  if (over < 0) return
  await sleep(Math.min(MAX_DELAY_MS, 2 ** Math.min(over, 6) * 250))
}

/** 默认密码会话在改密前禁止一切写操作与后台页 */
export function passwordChangeRequired(session: unknown): boolean {
  return !!(session as any)?.user?.needsPasswordChange
}

export type CredentialCheck =
  | {
      ok: true
      id: string
      email: string
      name?: string
      /** `admin` | `reader`（2026-09-25）。判定入口在 lib/app-auth.ts。 */
      role: string
      needsPasswordChange: boolean
    }
  | { ok: false; reason: "invalid" | "rate_limited" }

/**
 * 凭据校验 —— **Web 登录与 App「用邮箱+密码换 API Token」共享同一份实现**。
 *
 * ## 为什么抽出来而不是让新接口自己写一遍
 * 这段逻辑里真正有价值的是**限流**：双维度计数（IP 为主闸、email 为辅）、
 * 超阈值只做渐进延迟而不硬锁（避免限流器反过来成为锁死管理员的 DoS 工具）、
 * 正确凭据永远可以登录。任何一次「照着写一遍」都会立刻退化成
 * 「可被爆破」或「可被 DoS」，而且是静默的 —— 所以要复用的是它，不是密码比对。
 *
 * 返回值刻意不用 NextAuth 的 User 形状：Web 登录靠 `needsPasswordChange` 决定
 * 是否强制改密，App 换取 Token 也用它拒掉「还在用默认密码」的账号。
 *
 * ⚠️ `prisma` 保持**动态 import**：静态 import 会让 middleware/edge 打包链
 * 拉入 pg（见原 authorize 里的注释）。
 */
/**
 * 邮箱归一化的实现挪到了 `lib/login-shared.ts`（2026-09-30）：登录表单是客户端组件，
 * 不能引本模块（这里有 NextAuth 服务端配置 + 动态 prisma），于是它自己又写了一遍
 * 补全域名的规则。规则只能有一处 —— 挪到一个零依赖模块，三边共用。
 */

export async function verifyCredentials(
  email: string,
  password: string,
  request?: Request,
): Promise<CredentialCheck> {
  // 惰性加载：避免 middleware/edge 打包链拉入 pg
  const { prisma } = await import("./prisma")

  // ── 账号归一化（2026-09-21）：支持「用户名」登录 ──────────────────
  // Web 登录表单本就把不带 @ 的输入补全成 `用户名@slowlog.dev` 再提交；
  // 把同一约定下沉到这里，App 的换取 Token 接口（/api/app/auth/token）
  // 就能直接收用户名 —— 两端行为一致，且对已传完整邮箱的调用零影响。
  // 必须在 emailKey 之前归一化，否则限流的「辅助维度」会把
  // `admin` 和 `admin@slowlog.dev` 记成两个账号（各算各的失败次数）。
  const mail = normalizeLoginEmail(email)
  if (!mail || !password) return { ok: false, reason: "invalid" }

  const ipKey = `ip:${clientIp(request)}`
  const emailKey = `email:${mail}`
  const now = Date.now()

  // 最终防线：同一来源短窗内异常高频失败
  if (failCount(ipKey, now) >= IP_HARD_LIMIT) return { ok: false, reason: "rate_limited" }

  // 退避延时**不再放在查库之前**（2026-09-30）。原先的顺序是
  // 「先 sleep 再校验」，于是作者本人输错 5 次后，第 6 次哪怕密码完全正确，
  // 也要先睡最多 3s —— 叠上 Neon 冷连接（实测凭据那一枪 6.9s）就成了
  // 「卡在登录中，要刷新重试几十秒」。现在只在**确认失败之后**才睡：
  // 暴力破解者照样每次都付延时（且计的是本次的数），正确凭据不再被惩罚。
  // case-insensitive: legacy rows may store mixed-case emails
  const user = await prisma.user.findFirst({ where: { email: { equals: mail, mode: "insensitive" } } })
  if (!user) {
    recordFail(ipKey, now)
    recordFail(emailKey, now)
    await applyBackoff(ipKey, emailKey, now)
    return { ok: false, reason: "invalid" }
  }
  // ⚠️ 不能直接 await bcrypt.compare：历史脏数据里存在 `password` 列不是合法
  // bcrypt 哈希的行（早期脚本/迁移写入），bcryptjs 遇到这种值会**抛异常**而不是
  // 返回 false —— 表现就是「输对这个账号的密码 → HTTP 500」。500 对用户毫无信息量
  // （分不清是密码错还是数据坏），还把「这个邮箱确实有账号」用状态码泄漏给了枚举探测。
  // 一律按密码错误处理，并留下可定位的日志（只出 id，不出邮箱）。
  let ok: boolean
  try {
    ok = await bcrypt.compare(password, user.password)
  } catch (e) {
    console.error("[auth] 密码哈希无法比对，该行 password 不是合法 bcrypt 值", user.id, e)
    ok = false
  }
  if (!ok) {
    recordFail(ipKey, now)
    recordFail(emailKey, now)
    await applyBackoff(ipKey, emailKey, now)
    return { ok: false, reason: "invalid" }
  }
  // 成功即同时复位该来源与账号的失败计数
  failTable.delete(ipKey)
  failTable.delete(emailKey)
  // 检测是否为默认账户（首次登录未改密）：拿 env 给的初始口令与库中哈希比对，
  // 改过密后不再命中 ⇒ 不需要额外字段，也不再需要把明文写进代码。
  let isDefault = false
  if (DEFAULT_PASSWORD && user.email.toLowerCase() === DEFAULT_EMAIL) {
    try {
      isDefault = await bcrypt.compare(DEFAULT_PASSWORD, user.password)
    } catch (e) {
      // 脏行（非 bcrypt 值）只影响"是否强制改密"，不影响登录本身
      console.warn("[auth] 默认账户判定失败，按不需要改密处理:", user.id, e instanceof Error ? e.message : e)
    }
  }
  return {
    ok: true,
    id: user.id,
    email: user.email,
    name: user.name ?? undefined,
    role: user.role,
    needsPasswordChange: isDefault,
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds, request) {
        // 全部逻辑收在 verifyCredentials 里，与 App 换取 Token 共用。
        // NextAuth 只关心「有没有这个人」，失败原因（凭据错 / 限流）在此不可区分。
        const r = await verifyCredentials(
          (creds?.email as string) ?? "",
          (creds?.password as string) ?? "",
          request,
        )
        if (!r.ok) return null
        return {
          id: r.id,
          email: r.email,
          name: r.name,
          role: r.role,
          needsPasswordChange: r.needsPasswordChange,
        }
      },
    }),
  ],
})
