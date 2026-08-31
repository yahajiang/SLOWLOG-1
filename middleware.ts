import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl

  // 兼容旧路径 /admin -> /dashboard
  if (pathname.startsWith("/admin")) {
    const newPath = pathname.replace("/admin", "/dashboard") + req.nextUrl.search
    return NextResponse.redirect(new URL(newPath, req.nextUrl))
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
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
