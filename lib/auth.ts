import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth-config"

const DEFAULT_EMAIL = "admin@slowlog.dev"
const DEFAULT_PASSWORD = "admin123"

// ── 登录限流（P1）：内存滑窗，5 次失败/15 分钟锁（按 email 键控）。
// ⚠️ serverless 内存为实例级——多实例部署下限流按实例生效，仍显著提高暴力成本。
const LOCK_THRESHOLD = 5
const LOCK_WINDOW_MS = 15 * 60 * 1000
const loginFails = new Map<string, { count: number; firstFailAt: number }>()

function isLocked(key: string): boolean {
  const rec = loginFails.get(key)
  if (!rec) return false
  if (Date.now() - rec.firstFailAt > LOCK_WINDOW_MS) {
    loginFails.delete(key)
    return false
  }
  return rec.count >= LOCK_THRESHOLD
}

function recordFail(key: string) {
  const now = Date.now()
  const rec = loginFails.get(key)
  if (!rec || now - rec.firstFailAt > LOCK_WINDOW_MS) loginFails.set(key, { count: 1, firstFailAt: now })
  else rec.count++
  // 防无限增长：超过 100 键时顺手清理过期项
  if (loginFails.size > 100) {
    for (const [k, v] of loginFails) {
      if (now - v.firstFailAt > LOCK_WINDOW_MS) loginFails.delete(k)
    }
  }
}

function clearFails(key: string) {
  loginFails.delete(key)
}

/** 默认密码会话在改密前禁止一切写操作与后台页 */
export function passwordChangeRequired(session: unknown): boolean {
  return !!(session as any)?.user?.needsPasswordChange
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        // 惰性加载：避免 middleware/edge 打包链拉入 pg
        const { prisma } = await import("./prisma")
        const email = (creds?.email as string)?.toLowerCase().trim()
        const password = creds?.password as string
        if (!email || !password) return null
        // 限流：锁定期间静默拒绝（与"密码错误"同 UX，不泄漏锁定状态）
        if (isLocked(email)) return null
        // case-insensitive: legacy rows may store mixed-case emails
        const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } })
        if (!user) {
          recordFail(email)
          return null
        }
        const ok = await bcrypt.compare(password, user.password)
        if (!ok) {
          recordFail(email)
          return null
        }
        clearFails(email)
        // 检测是否为默认账户（首次登录未改密）
        const isDefault = user.email.toLowerCase() === DEFAULT_EMAIL && password === DEFAULT_PASSWORD
        return { id: user.id, email: user.email, name: user.name ?? undefined, needsPasswordChange: isDefault }
      },
    }),
  ],
})
