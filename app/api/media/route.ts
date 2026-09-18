import { NextRequest, NextResponse } from "next/server"
import { apiError } from "@/lib/api-utils"
import { auth, passwordChangeRequired } from "@/lib/auth"
import { requireSessionOrBearer } from "@/lib/app-auth"
import { prisma } from "@/lib/prisma"
import { compressAndUpload, deleteFromBlob, sanitizeFilename } from "@/lib/blob"

const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

const MAX_FILE_SIZE = 5 * 1024 * 1024
// 单请求文件数上限（P1-5）：避免一次提交大量文件造成内存与存储滥用
const MAX_FILES_PER_REQUEST = 10

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError(401, "未登录")
  // 分页：page 从 1 起（默认 1；每页 100）
  const pageParam = parseInt(new URL(req.url).searchParams.get("page") || "", 10)
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  const items = await prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 100, skip: (page - 1) * 100 })
  const total = await prisma.media.count()
  const res = NextResponse.json(items)
  res.headers.set("X-Total-Count", String(total))
  return res
}

export async function POST(req: NextRequest) {
  const gate = await requireSessionOrBearer(req)
  if (!gate) return apiError(401, "未登录")
  if (gate.kind === "session" && passwordChangeRequired(gate.session)) return apiError(403, "请先修改默认密码")

  const form = await req.formData()
  const files = form.getAll("file") as File[]
  if (!files.length) return apiError(400, "请选择文件")
  if (files.length > MAX_FILES_PER_REQUEST) {
    return apiError(400, `单次最多上传 ${MAX_FILES_PER_REQUEST} 个文件`)
  }

  // ── 阶段一：全量前置校验（P1-5）─────────────────────────────
  // 旧实现在循环内直接 return：前几个文件已上传成功、后一个不合法时接口整体
  // 报错却不回滚，产生用户不知情的"孤儿媒体"。这里先整体校验再提交。
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) return apiError(400, `「${file.name}」超过单张 5MB 上限`)
    if (!ALLOWED_MIMES.has(file.type)) {
      return apiError(400, `「${file.name}」类型不支持，仅限 JPEG/PNG/WebP/GIF`)
    }
  }

  // ── 阶段二：逐条上传；任一步失败则回滚本轮已产生的资源 ──────
  const uploadedUrls: string[] = []
  const results = []
  try {
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      // 文件名消毒（P1-5）：绝不直接拿客户端 file.name 当 Blob pathname / DB 字段
      const safeName = sanitizeFilename(file.name)
      const filename = `${Date.now()}-${safeName}`
      const res = await compressAndUpload(buffer, filename, { quality: 75 })
      const media = await prisma.media.create({
        data: {
          filename: safeName,
          url: res.url,
          size: res.size,
          width: res.width,
          height: res.height,
          mimeType: res.mimeType,
          alt: "",
        },
      })
      uploadedUrls.push(res.url)
      results.push(media)
    }
  } catch (e: any) {
    // 回滚：删除本轮已落盘的 Blob 与数据库记录，避免孤儿资源
    await Promise.allSettled(uploadedUrls.map((u) => deleteFromBlob(u)))
    await prisma.media.deleteMany({ where: { url: { in: uploadedUrls } } }).catch(() => {})
    console.error("[media] upload failed:", e)
    const msg = String(e?.message || "")
    // 内容不是有效图片属客户端错误 → 400（旧实现一律 500，掩盖了真实原因）
    const isInvalid =
      msg.includes("Invalid image file") ||
      // 兜底：sharp 探测阶段的原生错误文本，避免上游消息变化时误判为 500
      /unsupported image format|corrupt header|Input Buffer is empty/i.test(msg)
    return NextResponse.json(
      { error: isInvalid ? "文件内容不是有效图片（仅支持 JPEG/PNG/WebP/GIF）" : `上传失败：${msg || "未知错误"}` },
      { status: isInvalid ? 400 : 500 }
    )
  }
  return NextResponse.json(results)
}

export async function DELETE(req: NextRequest) {
  const gate = await requireSessionOrBearer(req)
  if (!gate) return apiError(401, "未登录")
  if (gate.kind === "session" && passwordChangeRequired(gate.session)) return apiError(403, "请先修改默认密码")
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return apiError(400, "缺少 id")
  const media = await prisma.media.findUnique({ where: { id } })
  if (!media) return apiError(404, "媒体不存在")
  // P3-26：按 url 形态分派删除。旧实现只在 url 含 blob.vercel-storage.com 时调用
  // deleteFromBlob，导致本地降级产物（/uploads/*）在删除记录后**文件永远留在磁盘**上
  // （本轮端到端测试实测复现）。data: URI 是内嵌内容，无外部资源可删，跳过。
  if (!media.url.startsWith("data:")) await deleteFromBlob(media.url)
  await prisma.media.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
