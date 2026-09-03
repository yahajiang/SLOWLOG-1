import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { compressAndUpload, deleteFromBlob } from "@/lib/blob"

const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const items = await prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 100 })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const form = await req.formData()
  const files = form.getAll("file") as File[]
  if (!files.length) return NextResponse.json({ error: "No file" }, { status: 400 })
  const results = []
  try {
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "单张上限5MB" }, { status: 400 })
      if (!ALLOWED_MIMES.has(file.type)) return NextResponse.json({ error: "仅支持 JPEG/PNG/WebP/GIF" }, { status: 400 })
      const filename = `${Date.now()}-${file.name}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const res = await compressAndUpload(buffer, filename, { quality: 75 })
      const media = await prisma.media.create({ data: { filename: file.name, url: res.url, size: res.size, width: res.width, height: res.height, mimeType: res.mimeType, alt: "" } })
      results.push(media)
    }
  } catch (e: any) {
    // 错误透明化：Blob/压缩失败时返回具体原因，不再裸 500
    console.error("[media] upload failed:", e)
    return NextResponse.json({ error: `上传失败：${e?.message || "未知错误"}` }, { status: 500 })
  }
  return NextResponse.json(results)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const media = await prisma.media.findUnique({ where: { id } })
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await deleteFromBlob(media.url)
  await prisma.media.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
