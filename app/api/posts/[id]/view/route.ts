import { NextRequest, NextResponse } from "next/server"
import { incrementViewCount } from "@/lib/posts"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// 浏览计数：公开端点，仅对已发布文章 +1；去重由前端 sessionStorage 承担（每会话每篇一次）
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const post = await prisma.post.findUnique({ where: { id }, select: { status: true } })
    if (!post || post.status !== "published") {
      return NextResponse.json({ ok: false }, { status: 404 })
    }
    await incrementViewCount(id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
