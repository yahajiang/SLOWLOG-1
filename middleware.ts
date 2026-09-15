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

// 平板：iPad / Android 平板（Android 且无 Mobile）。iPadOS 13+ UA 与 macOS 相同，
// 这部分由桌面树内的 TabletGate（视口 + 粗指针）兜底引导。
const TABLET_UA_RE = /iPad|Tablet|Android(?!.*Mobile)/i

function tabletTarget(pathname: string): string | null {
  if (pathname === "/") return "/t"
  if (pathname === "/archive") return "/t/archive"
  if (pathname.startsWith("/posts/")) return "/t" + pathname
  return null
}

/**
 * 重定向目标应基于「请求真值」：Vercel + Cloudflare 代理链路下，nextUrl.origin
 * 可能被解析成部署域（slowlog.vercel.app——被墙，访客侧直接超时）。
 *
 * P3-19（加固）：但不能无条件信任客户端可提供的 Host / X-Forwarded-Host ——
 * 它们是开放的 302 目标注入面（把访客跳到攻击者站点做钓鱼）。因此：
 *   ① 请求 host 在**白名单内**才采用（保留原有绕过被墙域名的能力）；
 *   ② 否则回退到站点自身的 env 配置，与 lib/site-url.ts「只信任 env」的策略对齐。
 * 白名单：环境变量 ALLOWED_REDIRECT_HOSTS（逗号分隔）扩展；
 * 未配置时默认只信任 NEXT_PUBLIC_SITE_URL 的 host。
 */
function allowedRedirectHosts(): string[] {
  const extra = (process.env.ALLOWED_REDIRECT_HOSTS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (extra.length) return extra
  try {
    return [new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").host]
  } catch {
    return []
  }
}

function redirectFor(req: NextRequest, target: string) {
  const h = req.headers
  // 协议：代理链（Vercel/CF）注入的 x-forwarded-proto 优先；本地直连没有该头，
  // 回退 req.nextUrl.protocol（http://localhost:3000 → http），不能硬编码 https
  // —— 否则本地即使 host 落在白名单内，也会被 307 到打不开的 https://localhost:3000
  const proto =
    (h.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "") || "https").split(",")[0].trim() || "https"
  const reqHost =
    (h.get("x-forwarded-host") || "").split(",")[0].trim() ||
    h.get("host") ||
    req.nextUrl.host
  const allow = allowedRedirectHosts()
  const host = allow.includes(reqHost) ? reqHost : allow[0] || req.nextUrl.host
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

  // 平板（iPad / Android 平板 / view=tablet cookie）→ /t 平板树；view=desktop 尊重用户选择
  if (
    !pathname.startsWith("/m") &&
    !pathname.startsWith("/t") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/dashboard")
  ) {
    const view = req.cookies.get("view")?.value
    const ua = req.headers.get("user-agent") || ""
    const wantsTablet = view === "tablet" || (!view && TABLET_UA_RE.test(ua))
    if (view !== "desktop" && wantsTablet) {
      const target = tabletTarget(pathname)
      if (target) {
        const url = req.nextUrl.clone()
        url.pathname = target
        return NextResponse.rewrite(url)
      }
    }
  }

  // 未认证用户重定向到登录页（移动后台与移动改密页走 /m/login）
  if ((pathname.startsWith("/m/dashboard") || pathname === "/m/change-password") && !req.auth) {
    return redirectFor(req, "/m/login")
  }
  if (pathname.startsWith("/dashboard") && !req.auth) {
    return redirectFor(req, "/login")
  }

  const needsChange = (req.auth?.user as any)?.needsPasswordChange
  if (needsChange) {
    // N-7：移动端改密走移动版页面，不再把手机用户踢进桌面壳。
    // 注意 /m/change-password 自身不在此分支内 —— 否则会自我重定向成死循环。
    if (pathname.startsWith("/m/dashboard")) {
      return redirectFor(req, "/m/change-password")
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
    "/m/change-password",
    "/m/dashboard/:path*",
  ],
}
