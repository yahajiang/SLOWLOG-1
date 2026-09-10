import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth-config"

const DEFAULT_EMAIL = "admin@slowlog.dev"
const DEFAULT_PASSWORD = "admin123"

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
        // case-insensitive: legacy rows may store mixed-case emails
        const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } })
        if (!user) return null
        const ok = await bcrypt.compare(password, user.password)
        if (!ok) return null
        // 检测是否为默认账户（首次登录未改密）
        const isDefault = user.email.toLowerCase() === DEFAULT_EMAIL && password === DEFAULT_PASSWORD
        return { id: user.id, email: user.email, name: user.name ?? undefined, needsPasswordChange: isDefault }
      },
    }),
  ],
})
