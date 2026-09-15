import { NextRequest, NextResponse } from "next/server"
import { incrementViewCount, isPublicPost } from "@/lib/posts"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// 浏览计数：前端 sessionStorage 负责体验层去重，服务端再按 IP+文章短窗兜底。
const VIEW_WINDOW_MS = 15 * 60 * 1000
const recentViews = new Map<string, number>()

/**
 * P3-20：客户端标识。
 * `x-forwarded-for` 首段是客户端可伪造的（直连或代理未覆盖时尤其如此），
 * 故优先采用平台注入、客户端无法覆盖的头部，最后才退回 XFF。
 * 仍无法做到绝对可信——这是刻意的取舍：浏览计数不是安全边界，
 * 不值得为此引入强一致存储；去重目标是"防同一浏览器重复提交"，而非反刷量。
 */
function clientIp(req: NextRequest) {
  const h = req.headers
  return (
    h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("cf-connecting-ip")?.trim() ||
    h.get("x-real-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  )
}

/**
 * 短窗去重（P3-20 附带加固）：
 * 旧实现仅在 size > 2000 时遍历整表清理"已过期"项，而窗口内的键永不过期，
 * 因此表仍会无界增长，且每次清理都是 O(n) 停顿。
 * 现在改为容量硬上限 + 按插入顺序批量淘汰最旧 1/4（摊销 O(1)）。
 */
const MAX_VIEW_ENTRIES = 5_000
function countedRecently(key: string, now: number) {
  const last = recentViews.get(key)
  if (last && now - last < VIEW_WINDOW_MS) return true
  if (recentViews.size >= MAX_VIEW_ENTRIES) {
    const drop = Math.floor(MAX_VIEW_ENTRIES / 4)
    let i = 0
    for (const k of recentViews.keys()) {
      recentViews.delete(k)
      if (++i >= drop) break
    }
  }
  recentViews.set(key, now)
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
