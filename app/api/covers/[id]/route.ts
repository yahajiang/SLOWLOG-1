import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { prisma } from "@/lib/prisma"
import { apiError } from "@/lib/api-utils"
import { bearerToken } from "@/lib/app-auth"
import { isPublicPost } from "@/lib/posts"
import { deriveCover, renderCoverSvg } from "@/lib/cover-svg"

export const dynamic = "force-dynamic"

/**
 * 封面端点：两层缓存。
 *
 * ## 背景
 * sharp 每次请求都重新光栅化 SVG，实测源站耗时 6–8 秒（即便 `age>0`
 * 仍回源）。App 端 Coil 默认读超时约 5s，会导致封面**必然加载失败**、
 * 卡片留白。因此缓存不是优化，是功能能否工作的前提。
 *
 * ## 第一层：CDN 边缘缓存（跨实例共享）
 * 公开封面带 `s-maxage=31536000` + `stale-while-revalidate`，
 * 由 CDN/反代按 `(URL, Authorization)` 缓存。这是**跨实例共享的关键**——
 * 进程内 LRU 各自为政，冷实例首次请求仍会吃满 6–8s；
 * 有了边缘缓存，同一份封面全集群只需源站生成一次。
 *
 * ⚠️ `Vary: Authorization` 不能去掉：带 token 的请求可能命中草稿封面，
 * 若被边缘缓存则存在越权读风险。以 `Authorization` 为 vary 维度后，
 * 匿名与带 token 的请求各占一个缓存槽，互不串味。
 *
 * ## 第二层：进程内 LRU（最后一道）
 * 边缘缓存需要「第一次」有人付 6–8s 的代价；同进程内的后续请求走内存直出
 * （毫秒级），避免边缘缓存尚未回填时被并发请求打爆。
 * 上限 64 条，800×450 PNG 约 15KB，总量 < 2MB。
 */
type CacheEntry = { png: Buffer; version: string }
const PNG_CACHE = new Map<string, CacheEntry>()
const PNG_CACHE_MAX = 64

function cacheGet(key: string, version: string): Buffer | null {
  const hit = PNG_CACHE.get(key)
  if (!hit) return null
  if (hit.version !== version) {
    PNG_CACHE.delete(key)
    return null
  }
  // LRU：命中后挪到队尾
  PNG_CACHE.delete(key)
  PNG_CACHE.set(key, hit)
  return hit.png
}

function cacheSet(key: string, version: string, png: Buffer): void {
  if (PNG_CACHE.size >= PNG_CACHE_MAX) {
    const oldest = PNG_CACHE.keys().next().value
    if (oldest !== undefined) PNG_CACHE.delete(oldest)
  }
  PNG_CACHE.set(key, { png, version })
}

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

  const derived = deriveCover({
    id: post.id,
    // 与 CoverArt.tsx 同源：seed 用 title（而非 titleZh），保证 Web/App 构图族一致
    title: post.title || "",
    category: post.category,
    tags: post.tags,
  })

  // ── 内容版本 vs 客户端缓存键 ──────────────────────────────────────────
  // contentType 是**内容指纹**：封面只由 id + title + updatedAt 决定，
  // 标题改了 updatedAt 必变，所以它既是进程内 LRU 的失效依据，
  // 也是回给客户端的 ETag。
  //
  // ⚠️ 这里的 `?v=` 是**客户端缓存键**，不能与内容指纹混为一谈：
  // 它让 App 能在图片内容变化时构造出一个全新的 URL，
  // 从而绕开 CDN/磁盘上那条 immutable 的旧记录。
  // 服务端不校验 `v` 的正确性（无法校验，且不必要）——
  // 只要 URL 变了，缓存槽就是新的；URL 没变，就复用。
  // 若把 `v` 掺进内容指纹，客户端随便传个值就能击穿缓存，反而有害。
  const contentType = String(post.updatedAt?.getTime?.() ?? post.updatedAt ?? "")
  const cacheKey = `${post.id}:${width}`
  let png = cacheGet(cacheKey, contentType)
  if (!png) {
    const svg = renderCoverSvg(derived, width, height)
    png = await sharp(Buffer.from(svg)).png().toBuffer()
    cacheSet(cacheKey, contentType, png)
  }

  const etag = `"${post.id}-${width}-${contentType}"`

  // 条件请求：客户端/边缘缓存可用 If-None-Match 短路，省一次传图
  if (req.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } })
  }

  // 草稿/定时封面禁止进入公共 CDN 缓存，避免 id/slug 被猜中后间接公开
  const publicPost = isPublicPost(post)
  const cacheControl = !publicPost
    ? "private, no-store"
    : // 一年 immutable + 一天 stale-while-revalidate：
      // 边缘缓存过期后先回旧图、后台异步回填，用户永远不等 sharp。
      "public, max-age=3600, s-maxage=31536000, stale-while-revalidate=86400, immutable"

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(png.length),
      "Cache-Control": cacheControl,
      ETag: etag,
      // 带 token 的请求可能拿到草稿封面，必须按 Authorization 分桶，
      // 否则边缘缓存会把草稿图吐给匿名用户
      Vary: "Authorization",
    },
  })
}
