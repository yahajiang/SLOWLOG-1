import { NextRequest, NextResponse } from "next/server"
import { incrementViewCount, isPublicPost } from "@/lib/posts"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// 浏览计数：前端 sessionStorage 负责体验层去重，服务端再按 IP+文章短窗兜底。
const VIEW_WINDOW_MS = 15 * 60 * 1000
const recentViews = new Map<string, number>()

function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
}

function countedRecently(key: string, now: number) {
  const last = recentViews.get(key)
  if (last && now - last < VIEW_WINDOW_MS) return true
  recentViews.set(key, now)
  if (recentViews.size > 2_000) for (const [oldKey, oldAt] of recentViews) if (now - oldAt >= VIEW_WINDOW_MS) recentViews.delete(oldKey)
  return false
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const post = await prisma.post.findUnique({ where: { id }, select: { status: true, publishedAt: true } })
    if (!isPublicPost(post)) {
      return NextResponse.json({ ok: false }, { status: 404 })
    }
    if (countedRecently(`${id}:${clientIp(req)}`, Date.now())) return NextResponse.json({ ok: true, counted: false })
    await incrementViewCount(id)
    return NextResponse.json({ ok: true, counted: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
