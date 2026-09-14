import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth-config"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const { auth } = NextAuth(authConfig)

// 仅手机 UA 进移动版（平板/桌面走桌面版）；桌面端渲染零影响
const MOBILE_UA_RE = /Android.*Mobile|iPhone|iPod|Windows Phone/i

function mobileTarget(pathname: string): string | null {
  if (pathname === "/") return "/m"
  if (pathname === "/login") return "/m/login"
  if (pathname === "/archive" || pathname.startsWith("/archive/")) return "/m" + pathname
  if (pathname.startsWith("/posts/")) return "/m" + pathname
  return null
}

/**
 * 重定向必须基于「请求真值」：Vercel + Cloudflare 代理链路下，nextUrl.origin
 * 可能被解析成部署域（slowlog.vercel.app——被墙，访客侧直接超时）。
 * 优先 x-forwarded-host / x-forwarded-proto，退回 host，最后才用 nextUrl 兜底。
 */
function redirectFor(req: NextRequest, target: string) {
  const h = req.headers
  const proto = (h.get("x-forwarded-proto") || "https").split(",")[0].trim() || "https"
  const host =
    (h.get("x-forwarded-host") || "").split(",")[0].trim() ||
    h.get("host") ||
    req.nextUrl.host
  return NextResponse.redirect(new URL(target, `${proto}://${host}`))
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  // 兼容旧路径 /admin -> /dashboard
  if (pathname.startsWith("/admin")) {
    const newPath = pathname.replace("/admin", "/dashboard") + req.nextUrl.search
    return redirectFor(req, newPath)
  }

  if (!pathname.startsWith("/m") && !pathname.startsWith("/api") && !pathname.startsWith("/dashboard")) {
    const optOut = req.cookies.get("view")?.value === "desktop"
    if (!optOut) {
      const ua = req.headers.get("user-agent") || ""
      const target = MOBILE_UA_RE.test(ua) ? mobileTarget(pathname) : null
      if (target) {
        const url = req.nextUrl.clone()
        url.pathname = target
        return NextResponse.rewrite(url)
      }
    }
  }

  // 未认证用户重定向到登录页（移动后台走 /m/login）
  if (pathname.startsWith("/m/dashboard") && !req.auth) {
    return redirectFor(req, "/m/login")
  }
  if (pathname.startsWith("/dashboard") && !req.auth) {
    return redirectFor(req, "/login")
  }

  const needsChange = (req.auth?.user as any)?.needsPasswordChange
  if (needsChange) {
    if (pathname.startsWith("/m/dashboard")) {
      return redirectFor(req, "/dashboard/change-password")
    }
    if (pathname.startsWith("/dashboard") && pathname !== "/dashboard/change-password") {
      return redirectFor(req, "/dashboard/change-password")
    }
  }
})

export const config = {
  matcher: [
    "/",
    "/archive/:path*",
    "/posts/:path*",
    "/login",
    "/dashboard/:path*",
    "/admin/:path*",
    "/m/dashboard/:path*",
  ],
}
