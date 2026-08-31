import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

const DEFAULT_EMAIL = "admin@slowlog.dev"
const DEFAULT_PASSWORD = "admin123"

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
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
})
