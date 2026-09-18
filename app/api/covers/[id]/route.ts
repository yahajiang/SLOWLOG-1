import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { prisma } from "@/lib/prisma"
import { apiError } from "@/lib/api-utils"
import { bearerToken } from "@/lib/app-auth"
import { isPublicPost } from "@/lib/posts"
import { deriveCover, renderCoverSvg } from "@/lib/cover-svg"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post =
    (await prisma.post.findUnique({ where: { id }, include: { category: true } })) ||
    (await prisma.post.findUnique({ where: { slug: id }, include: { category: true } }))
  if (!post) return apiError(404, "内容不存在")

  const bearer = await bearerToken(req)
  if (!bearer && !isPublicPost(post)) return apiError(404, "内容不存在")

  const wRaw = parseInt(new URL(req.url).searchParams.get("w") || "", 10)
  const width = wRaw === 1600 ? 1600 : 800
  const height = Math.round((width * 9) / 16)
  const v = new URL(req.url).searchParams.get("v")

  const derived = deriveCover({
    id: post.id,
    // 与 CoverArt.tsx 同源：seed 用 title（而非 titleZh），保证 Web/App 构图族一致
    title: post.title || "",
    category: post.category,
    tags: post.tags,
  })
  const svg = renderCoverSvg(derived, width, height)
  const png = await sharp(Buffer.from(svg)).png().toBuffer()

  // 草稿/定时封面禁止进入公共 CDN 缓存，避免 id/slug 被猜中后间接公开
  const publicPost = isPublicPost(post)
  const cacheControl = !publicPost
    ? "private, no-store"
    : v
      ? "public, max-age=31536000, immutable"
      : "public, max-age=300"

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(png.length),
      "Cache-Control": cacheControl,
      Vary: "Authorization",
    },
  })
}
