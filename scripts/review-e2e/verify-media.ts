// 验证 P1-1 / P1-5 修复（内容校验 + 文件名消毒）
import fs from "fs"
import path from "path"
import { compressAndUpload, sanitizeFilename } from "../../lib/blob"

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
)
// 标准 1×1 透明 GIF（87a）
const TINY_GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64")

const created: string[] = []

console.log("══════ P1-1 内容校验：伪装成图片的非图片内容 ══════")
const attacks: [string, Buffer, string][] = [
  ["HTML 伪装 .gif", Buffer.from("<html><body><script>alert(1)</script></body></html>"), "evil.gif"],
  ["JS 伪装 .gif", Buffer.from("alert(document.cookie)//"), "x.gif"],
  ["纯文本伪装 .png", Buffer.from("not an image at all"), "fake.png"],
  ["SVG 伪装 .gif", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), "s.gif"],
  ["空文件 .gif", Buffer.alloc(0), "empty.gif"],
]
let blocked = 0
for (const [name, buf, fn] of attacks) {
  try {
    const r = await compressAndUpload(buf, fn)
    created.push(r.url)
    console.log(`   ❌ ${name} 未被拦截 → 已入库 ${r.url}`)
  } catch (e: any) {
    blocked++
    console.log(`   ✅ ${name} 被拦截（${e.message}）`)
  }
}
console.log(`   → 拦截 ${blocked}/${attacks.length}`)

console.log("\n══════ 对照组：合法图片应正常通过 ══════")
for (const [name, buf, fn] of [
  ["合法 PNG", TINY_PNG, "ok.png"],
  ["合法 GIF", TINY_GIF, "ok.gif"],
] as [string, Buffer, string][]) {
  try {
    const r = await compressAndUpload(buf, fn)
    created.push(r.url)
    console.log(`   ✅ ${name} 通过 → mimeType=${r.mimeType} ${r.width}×${r.height} ${r.size}B url=${r.url}`)
  } catch (e: any) {
    console.log(`   ❌ ${name} 被误拦：${e.message}`)
  }
}

console.log("\n══════ 扩展名归正（内容格式决定后缀）══════")
try {
  const r = await compressAndUpload(TINY_PNG, "mislabeled.gif") // GIF 名但内容是 PNG
  created.push(r.url)
  console.log(`   PNG 内容 + .gif 文件名 → mimeType=${r.mimeType} url 后缀=${path.extname(r.url)}`)
} catch (e: any) {
  console.log(`   ❌ ${e.message}`)
}

console.log("\n══════ P1-5 文件名消毒 ══════")
for (const raw of ["../../evil.png", "a/../../b.png", "..\\..\\win.png", "nor mal name.png", "\u0000null.png", "隐藏文件.png", "a".repeat(300) + ".png", ""]) {
  console.log(`   ${JSON.stringify(raw).slice(0, 40).padEnd(42)} → ${JSON.stringify(sanitizeFilename(raw)).slice(0, 50)}`)
}

// 清理测试产物
console.log("\n══════ 清理测试产物 ══════")
let removed = 0
for (const url of created) {
  if (url.startsWith("/uploads/")) {
    const f = path.join(process.cwd(), "public", url.replace(/^\/+/, ""))
    try { fs.unlinkSync(f); removed++ } catch {}
  }
}
console.log(`   已清理 ${removed} 个本地降级文件（data URI 与 Blob 无需清理）`)
console.log(`\n══════ 结论：${blocked}/${attacks.length} 伪装内容被拦截 ══════`)
