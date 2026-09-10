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
      }
      return token
    },
    async session({ session, token }) {
      if (token?.id) (session.user as any).id = token.id
      ;(session.user as any).needsPasswordChange = token.needsPasswordChange || false
      return session
    },
  },
  pages: { signIn: "/login" },
}
