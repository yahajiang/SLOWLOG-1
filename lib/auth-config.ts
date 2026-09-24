import type { NextAuthConfig } from "next-auth"

/**
 * Edge/middleware 可共用的 Auth 配置：不含 Prisma / pg。
 * 完整 Credentials + DB 校验在 lib/auth.ts（仅 Node runtime）。
 */
export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.needsPasswordChange = (user as any).needsPasswordChange || false
        // 角色（2026-09-25）：只有登录那一刻读一次库，之后一直随 JWT 走。
        // ⚠️ 因此**改了某账号的 role 不会让已签发的会话立刻变权限**，
        // 要生效得让对方重新登录（撤销其令牌 / 提示重登）。
        // 老会话的 JWT 里没有这个字段 ⇒ 下游按 admin 处理（见 lib/app-auth.ts
        // 的 canReadUnpublished），否则部署那一刻会把作者自己踢出后台。
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token?.id) (session.user as any).id = token.id
      ;(session.user as any).needsPasswordChange = token.needsPasswordChange || false
      ;(session.user as any).role = token.role ?? null
      return session
    },
  },
  pages: { signIn: "/login" },
}
