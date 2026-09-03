import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

// 仅手机 UA 进移动版（平板/桌面走桌面版）；桌面端渲染零影响
const MOBILE_UA_RE = /Android.*Mobile|iPhone|iPod|Windows Phone/i

function mobileTarget(pathname: string): string | null {
  if (pathname === "/") return "/m"
  if (pathname === "/login") return "/m/login"
  if (pathname === "/archive" || pathname.startsWith("/archive/")) return "/m" + pathname
  if (pathname.startsWith("/posts/")) return "/m" + pathname
  return null
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  // 兼容旧路径 /admin -> /dashboard
  if (pathname.startsWith("/admin")) {
    const newPath = pathname.replace("/admin", "/dashboard") + req.nextUrl.search
    return NextResponse.redirect(new URL(newPath, req.nextUrl))
  }

  // 移动端独立版：手机 UA 自动改写到 /m（地址栏不变），cookie view=desktop 可切回
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

  // 未认证用户重定向到登录页
  if (pathname.startsWith("/dashboard") && !req.auth) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  // 默认账户强制改密：已登录但 needsPasswordChange 时，只允许访问改密页
  const needsChange = (req.auth?.user as any)?.needsPasswordChange
  if (needsChange && pathname.startsWith("/dashboard") && pathname !== "/dashboard/change-password") {
    return NextResponse.redirect(new URL("/dashboard/change-password", req.nextUrl))
  }
})

export const config = {
  matcher: ["/", "/archive/:path*", "/posts/:path*", "/login", "/dashboard/:path*", "/admin/:path*"],
}
