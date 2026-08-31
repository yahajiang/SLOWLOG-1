import { put, del } from "@vercel/blob"
import sharp from "sharp"
import fs from "fs/promises"
import path from "path"

type CompressOpts = { quality?: number; maxWidth?: number }

export async function compressAndUpload(
  file: File | Buffer,
  filename: string,
  opts: CompressOpts = {}
): Promise<{ url: string; width?: number; height?: number; size: number; mimeType: string }> {
  const quality = opts.quality ?? 75
  const maxWidth = opts.maxWidth ?? 1920
  const buffer = file instanceof Buffer ? file : Buffer.from(await (file as File).arrayBuffer())
  const origMime = (file as any).type || guessMime(filename)

  const token = process.env.BLOB_READ_WRITE_TOKEN || ""
  const isPlaceholder = !token || token.includes("placeholder") || token.length < 20

  // helper: fallback to local public/uploads
  async function putLocal(name: string, data: Buffer, mime: string) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    await fs.mkdir(uploadsDir, { recursive: true })
    const safeName = `${Date.now()}-${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    const filePath = path.join(uploadsDir, safeName)
    await fs.writeFile(filePath, data)
    return { url: `/uploads/${safeName}` }
  }

  // SVG/GIF keep original
  if (origMime === "image/svg+xml" || origMime === "image/gif" || filename.endsWith(".svg") || filename.endsWith(".gif")) {
    if (isPlaceholder) {
      const local = await putLocal(filename, buffer, origMime)
      return { url: local.url, size: buffer.length, mimeType: origMime }
    }
    const blob = await put(filename, buffer, { access: "public", contentType: origMime })
    return { url: blob.url, size: buffer.length, mimeType: origMime }
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

  if (isPlaceholder) {
    const local = await putLocal(outExt, outBuffer, targetMime)
    return {
      url: local.url,
      width: metaAfter.width,
      height: metaAfter.height,
      size: outBuffer.length,
      mimeType: targetMime,
    }
  }

  const blob = await put(outExt, outBuffer, { access: "public", contentType: targetMime })
  return {
    url: blob.url,
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
