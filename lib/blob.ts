import { put, del } from "@vercel/blob"
import sharp from "sharp"
import fs from "fs/promises"
import path from "path"

type CompressOpts = { quality?: number; maxWidth?: number }

/** 支持的图片格式：一律以 sharp 探测结果判定，不信任扩展名与客户端 MIME */
const SUPPORTED_FORMATS = new Set(["jpeg", "png", "webp", "gif"])
const FORMAT_MIME: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
}

export const INVALID_IMAGE_ERROR = "Invalid image file"

/**
 * 文件名消毒（P1-5）：Blob pathname 与本地落盘共用同一规则。
 * 防 `../` 路径穿越、空字节/控制字符、隐藏文件与超长名。
 * 保留中文：本站为中文博客，中文文件名常见且不影响 URL（会自动编码）；
 * 扩展名单独提取，避免消毒规则把它一起吃掉（如「隐藏文件.png」退化成「png」）。
 */
export function sanitizeFilename(name: string, maxLen = 120): string {
  const raw = (name || "").replace(/\.{2,}/g, "_")
  const m = raw.match(/\.([a-zA-Z0-9]{1,8})$/)
  const ext = m ? "." + m[1].toLowerCase() : ""
  const stemRaw = ext ? raw.slice(0, -ext.length) : raw
  const stem =
    stemRaw
      .replace(/[^\w.\-\u4e00-\u9fa5]/g, "_")
      .replace(/^[_\-.]+/, "")
      .replace(/[_\-.]+$/, "")
      .slice(-(Math.max(maxLen, 16) - ext.length)) || "file"
  return stem + ext
}

/** 归正扩展名：内容格式已由 sharp 确定，扩展名随之对齐，避免误导性后缀 */
function withExt(name: string, ext: string): string {
  return name.replace(/\.[^./\\]+$/, "") + ext
}

// 兜底：Blob 不可用时把文件内嵌为 data URI（媒体库与正文 <img> 均可直接使用，上传不中断）
async function toDataUri(buffer: Buffer, mime: string): Promise<string> {
  return `data:${mime};base64,${buffer.toString("base64")}`
}

// 写出链：Vercel Blob → 本地 public/uploads（仅本地开发可用，serverless 只读 FS 会失败）→ data URI
// （mime 参数与 Blob 链保持同签名以便调用方复用，本地落盘不需要它）
async function putLocal(name: string, data: Buffer, _mime: string) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads")
  await fs.mkdir(uploadsDir, { recursive: true })
  const safeName = `${Date.now()}-${sanitizeFilename(name)}`
  const filePath = path.join(uploadsDir, safeName)
  await fs.writeFile(filePath, data)
  return { url: `/uploads/${safeName}` }
}

async function persist(name: string, buffer: Buffer, mime: string): Promise<{ url: string }> {
  // 两条写出链共用同一消毒规则，避免"线上安全、降级路径不安全"的水位差
  const safe = sanitizeFilename(name)
  try {
    const blob = await put(safe, buffer, { access: "public", contentType: mime })
    return { url: blob.url }
  } catch (blobErr) {
    console.error("[blob] put failed, fallback to local:", blobErr instanceof Error ? blobErr.message : blobErr)
    try {
      return await putLocal(safe, buffer, mime)
    } catch (localErr) {
      console.error("[blob] local fallback failed, use data URI:", localErr instanceof Error ? localErr.message : localErr)
      return { url: await toDataUri(buffer, mime) }
    }
  }
}

/**
 * 压缩并上传图片。
 *
 * ⚠️ P1-1 修复要点：内容校验必须基于 sharp 探测出的**真实格式**。
 * 旧实现用 `(file as File).type || guessMime(filename)` 判定，而调用方传入的是
 * Buffer（无 `.type`）→ 退化为按扩展名猜测；再加上 `filename.endsWith(".gif")`
 * 即跳过 sharp 校验原样透传，导致**任意内容只要命名为 *.gif 就能绕过全部校验入库**。
 * 现在：先探测真实格式 → 不在支持列表或像素非法即抛错 → 才进入转码/上传。
 */
export async function compressAndUpload(
  file: File | Buffer,
  filename: string,
  opts: CompressOpts = {}
): Promise<{ url: string; width?: number; height?: number; size: number; mimeType: string }> {
  const quality = opts.quality ?? 75
  const maxWidth = opts.maxWidth ?? 1920
  const buffer = file instanceof Buffer ? file : Buffer.from(await (file as File).arrayBuffer())

  // 真实格式探测：sharp 对非图片/损坏数据会在 metadata() 阶段**直接抛错**
  // （如 "Input buffer contains unsupported image format"），必须一并收敛为
  // INVALID_IMAGE_ERROR，否则调用方会把它当作服务端故障返回 500 而非客户端错误 400。
  let metaBefore: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>
  try {
    metaBefore = await sharp(buffer, { animated: true }).metadata()
  } catch {
    throw new Error(INVALID_IMAGE_ERROR)
  }
  const format = metaBefore.format
  if (!format || !SUPPORTED_FORMATS.has(format) || !metaBefore.width || !metaBefore.height) {
    throw new Error(INVALID_IMAGE_ERROR)
  }

  // GIF：已确认是真实 GIF，原样上传以保留动图（重编码会丢帧/掉质量）
  if (format === "gif") {
    const res = await persist(withExt(filename, ".gif"), buffer, FORMAT_MIME.gif)
    return {
      url: res.url,
      width: metaBefore.width,
      height: metaBefore.height,
      size: buffer.length,
      mimeType: FORMAT_MIME.gif,
    }
  }

  const isPng = format === "png"
  const targetMime = isPng ? "image/webp" : FORMAT_MIME[format]
  const outExt = withExt(filename, isPng || format === "webp" ? ".webp" : ".jpg")

  let pipeline = sharp(buffer).rotate()
  if (metaBefore.width > maxWidth) {
    pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true })
  }
  pipeline =
    isPng || format === "webp" ? pipeline.webp({ quality }) : pipeline.jpeg({ quality, mozjpeg: true })

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
      const publicDir = path.join(process.cwd(), "public")
      // 归一化后必须仍位于 public 目录内，防止 ../ 逃逸（P3-5）
      const filePath = path.resolve(publicDir, url.replace(/^\/+/, ""))
      if (!filePath.startsWith(publicDir)) {
        console.warn(`[blob] 拒绝删除越界路径: ${url}`)
        return
      }
      await fs.unlink(filePath).catch((e: any) => {
        // 文件已不存在属幂等场景；其余错误（权限/占用）需要可观测
        if (e?.code !== "ENOENT") console.warn(`[blob] 本地文件删除失败 ${filePath}:`, e?.message)
      })
      return
    }
    await del(url)
  } catch (e) {
    // P3-6：旧实现是空 `catch {}`，所有删除失败被静默吞掉，
    // 一旦 Blob 删除持续失败，孤儿资源将永远无从察觉
    console.warn("[blob] 远端对象删除失败:", e instanceof Error ? e.message : e)
  }
}
