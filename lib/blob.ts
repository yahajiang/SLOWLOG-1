import { put, del } from "@vercel/blob"
import sharp from "sharp"
import fs from "fs/promises"
import path from "path"

type CompressOpts = { quality?: number; maxWidth?: number }

// 兜底：Blob 不可用时把文件内嵌为 data URI（媒体库与正文 <img> 均可直接使用，上传不中断）
async function toDataUri(buffer: Buffer, mime: string): Promise<string> {
  return `data:${mime};base64,${buffer.toString("base64")}`
}

// 写出链：Vercel Blob → 本地 public/uploads（仅本地开发可用，serverless 只读 FS 会失败）→ data URI
async function putLocal(name: string, data: Buffer, mime: string) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads")
  await fs.mkdir(uploadsDir, { recursive: true })
  const safeName = `${Date.now()}-${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
  const filePath = path.join(uploadsDir, safeName)
  await fs.writeFile(filePath, data)
  return { url: `/uploads/${safeName}` }
}

async function persist(name: string, buffer: Buffer, mime: string): Promise<{ url: string }> {
  try {
    const blob = await put(name, buffer, { access: "public", contentType: mime })
    return { url: blob.url }
  } catch (blobErr) {
    console.error("[blob] put failed, fallback to local:", blobErr instanceof Error ? blobErr.message : blobErr)
    try {
      const local = await putLocal(name, buffer, mime)
      return local
    } catch (localErr) {
      console.error("[blob] local fallback failed, use data URI:", localErr instanceof Error ? localErr.message : localErr)
      return { url: await toDataUri(buffer, mime) }
    }
  }
}

export async function compressAndUpload(
  file: File | Buffer,
  filename: string,
  opts: CompressOpts = {}
): Promise<{ url: string; width?: number; height?: number; size: number; mimeType: string }> {
  const quality = opts.quality ?? 75
  const maxWidth = opts.maxWidth ?? 1920
  const buffer = file instanceof Buffer ? file : Buffer.from(await (file as File).arrayBuffer())
  const origMime = (file as any).type || guessMime(filename)

  // SVG/GIF keep original
  if (origMime === "image/svg+xml" || origMime === "image/gif" || filename.endsWith(".svg") || filename.endsWith(".gif")) {
    const res = await persist(filename, buffer, origMime)
    return { url: res.url, size: buffer.length, mimeType: origMime }
  }

  // defense-in-depth: verify buffer is actually an image via sharp
  const metaBefore = await sharp(buffer).metadata()
  if (!metaBefore.width || !metaBefore.height) {
    throw new Error("Invalid image file")
  }

  let pipeline = sharp(buffer).rotate()
  // PNG -> WebP as per spec, JPEG/WebP compress
  const isPng = origMime === "image/png" || filename.endsWith(".png")
  const targetMime = isPng ? "image/webp" : origMime
  const outExt = isPng ? filename.replace(/\.png$/i, ".webp") : filename

  // resize if too large
  if (metaBefore.width && metaBefore.width > maxWidth) {
    pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true })
  }

  if (isPng || origMime === "image/webp" || targetMime === "image/webp") {
    pipeline = pipeline.webp({ quality })
  } else if (origMime === "image/jpeg" || origMime === "image/jpg" || filename.match(/\.jpe?g$/i)) {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true })
  } else {
    pipeline = pipeline.webp({ quality })
  }

  const outBuffer = await pipeline.toBuffer()
  const metaAfter = await sharp(outBuffer).metadata()

  const res = await persist(outExt, outBuffer, targetMime)
  return {
    url: res.url,
    width: metaAfter.width,
    height: metaAfter.height,
    size: outBuffer.length,
    mimeType: targetMime,
  }
}

export async function deleteFromBlob(url: string) {
  try {
    if (url.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", url)
      await fs.unlink(filePath).catch(() => {})
      return
    }
    await del(url)
  } catch {}
}

function guessMime(name: string): string {
  if (name.endsWith(".png")) return "image/png"
  if (name.endsWith(".webp")) return "image/webp"
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg"
  if (name.endsWith(".gif")) return "image/gif"
  if (name.endsWith(".svg")) return "image/svg+xml"
  return "application/octet-stream"
}
