// 修复后全量回归验证（无需数据库）
// 用法：npx tsx scripts/review-e2e/unit-verify.ts
import fs from "fs"
import os from "os"
import path from "path"
import { execSync } from "child_process"

import { slugify, slugFromTitle } from "../../lib/slug"
import { postCreateSchema } from "../../lib/schemas"
import { safeJsonLd } from "../../lib/adapt"
import { cdata } from "../../lib/xml"
import { sanitizeFilename, compressAndUpload } from "../../lib/blob"
import { safeColor, safeHref, safeImgSrc, parsePageConfig } from "../../lib/page-config"

const PY = "C:/Users/Yahajiang/.workbuddy/binaries/python/versions/3.13.12/python.exe"
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
)

let pass = 0
let fail = 0
const failures: string[] = []
function ok(name: string, cond: boolean, detail = "") {
  cond ? pass++ : (fail++, failures.push(name))
  console.log(`   ${cond ? "✅" : "❌"} ${name}${detail ? `  → ${detail}` : ""}`)
}

const tempFiles: string[] = []

console.log("\n════════ P0-1 中文标题 slug ════════")
{
  const titles = ["设计原则", "代码之美", "Hello 世界", "React 19 新特性", "!!!", ""]
  const slugs: string[] = []
  for (const t of titles) {
    const s = await slugFromTitle(t)
    slugs.push(s)
    console.log(`   ${JSON.stringify(t).padEnd(18)} → ${JSON.stringify(s)}`)
  }
  ok("中文标题生成拼音 slug 而非退化值 '-'", slugs[0] === "she-ji-yuan-ze" && slugs[1] === "dai-ma-zhi-mei")
  ok("全部输入生成的 slug 唯一", new Set(slugs).size === titles.length, `${slugs.length} 输入 / ${new Set(slugs).size} 唯一`)
  ok("slug 非空", slugs.every((s) => s.length > 0))

  const rejected = ["-", "--", "hello-", "a"]
  const accepted = ["hello-world", "Hello-World", "post-mf8k2x9a3b", "she-ji-yuan-ze"]
  ok(
    "zod 拒绝全部退化 slug（-、--、hello-、a）",
    rejected.every((s) => !postCreateSchema.safeParse({ title: "x", slug: s }).success),
    rejected.join(" ")
  )
  ok(
    "zod 接受合法 slug",
    accepted.every((s) => postCreateSchema.safeParse({ title: "x", slug: s }).success),
    accepted.join(" ")
  )
  ok("slugify 对中文返回空（供前端预览，服务端兜底）", slugify("设计原则") === "")
}

console.log("\n════════ P1-3 RSS CDATA 转义 ════════")
{
  const payload = "CDATA 注入 ]]> 测试"
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title><![CDATA[${cdata(payload)}]]></title></channel></rss>`
  console.log(`   输入: ${JSON.stringify(payload)}`)
  console.log(`   输出: <![CDATA[${cdata(payload)}]]>`)
  ok("不再出现可提前闭合的裸 ]]> 序列", !cdata(payload).includes("]]> 测试"))
  const f = path.join(os.tmpdir(), "slowlog-cdata-check.xml")
  tempFiles.push(f)
  fs.writeFileSync(f, xml, "utf8")
  let xmlOk = true
  try {
    execSync(`"${PY}" -c "import xml.dom.minidom,sys;xml.dom.minidom.parse(sys.argv[1])" "${f}"`, { stdio: "pipe" })
  } catch {
    xmlOk = false
  }
  ok("标准 XML 解析器校验通过", xmlOk)
  fs.writeFileSync(f, `<?xml version="1.0"?><r><t><![CDATA[${cdata("a]]>b]]>c")}]]></t></r>`, "utf8")
  let multiOk = true
  try {
    execSync(`"${PY}" -c "import xml.dom.minidom,sys;xml.dom.minidom.parse(sys.argv[1])" "${f}"`, { stdio: "pipe" })
  } catch {
    multiOk = false
  }
  ok("多个 ]]> 连续出现也能正确转义", multiOk)
}

console.log("\n════════ P1-4 JSON-LD 转义 ════════")
{
  const jsonLd = { "@type": "Article", headline: "</script><img src=x onerror=alert(1)>", description: "x" }
  const out = safeJsonLd(jsonLd)
  console.log(`   输出: ${out}`)
  ok("不含未转义的 </script> 闭合序列", !out.includes("</script>"))
  ok("不含未转义的 <img 标签起始", !out.includes("<img"))
  let parsed: any = null
  try {
    parsed = JSON.parse(out)
  } catch {
    /* 由下方断言兜住 */
  }
  ok("JSON 语义仍可被 JSON.parse 还原", parsed?.headline === jsonLd.headline)
}

console.log("\n════════ P1-1 媒体内容校验（伪装内容必须被拒）════════")
{
  const attacks: [string, Buffer, string][] = [
    ["HTML 伪装 .gif", Buffer.from("<html><script>alert(1)</script></html>"), "evil.gif"],
    ["纯文本伪装 .png", Buffer.from("not an image"), "fake.png"],
    ["SVG 伪装 .gif", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), "s.gif"],
    ["空文件 .gif", Buffer.alloc(0), "empty.gif"],
  ]
  let blocked = 0
  for (const [name, buf, fn] of attacks) {
    try {
      const r = await compressAndUpload(buf, fn)
      if (r.url.startsWith("/uploads/")) tempFiles.push(path.join(process.cwd(), "public", r.url.replace(/^\/+/, "")))
      console.log(`      ❌ ${name} 未被拦截`)
    } catch {
      blocked++
    }
  }
  ok("伪装内容全部被拦截", blocked === attacks.length, `${blocked}/${attacks.length}`)

  const r = await compressAndUpload(TINY_PNG, "ok.png")
  ok("合法 PNG 正常通过", !!r.url, `mimeType=${r.mimeType}`)
  if (r.url.startsWith("/uploads/")) tempFiles.push(path.join(process.cwd(), "public", r.url.replace(/^\/+/, "")))
}

console.log("\n════════ P1-5 文件名消毒 ════════")
{
  const cases: [string, (s: string) => boolean][] = [
    ["../../evil.png", (s) => !s.includes("/") && !s.includes("..")],
    ["..\\..\\win.png", (s) => !s.includes("\\") && !s.includes("..")],
    ["a/../../b.png", (s) => !s.includes("/") && !s.includes("..")],
    ["nor mal name.png", (s) => !s.includes(" ")],
    ["\u0000null.png", (s) => !s.includes("\u0000")],
    ["隐藏文件.png", (s) => s.endsWith(".png") && s.includes("隐藏文件")],
    ["", (s) => s.length > 0],
  ]
  let allOk = true
  for (const [raw, check] of cases) {
    const out = sanitizeFilename(raw)
    const good = check(out)
    if (!good) allOk = false
    console.log(`   ${JSON.stringify(raw).slice(0, 26).padEnd(28)} → ${JSON.stringify(out)}  ${good ? "✓" : "✗"}`)
  }
  ok("路径穿越/控制字符被清除，中文与扩展名保留", allOk)
  ok("超长文件名被截断", sanitizeFilename("a".repeat(300) + ".png").length <= 120)
}

console.log("\n════════ 对照组：渲染白名单防护（须仍然有效）════════")
{
  const results = [
    safeColor("red;}</style><script>alert(1)</script>") === undefined,
    safeColor("expression(alert(1))") === undefined,
    safeColor("url(javascript:alert(1))") === undefined,
    safeHref("javascript:alert(1)") === null,
    safeImgSrc("data:text/html;base64,PHNjcmlwdD4=") === null,
  ]
  ok("5 类 CSS/协议注入全部拦截", results.every(Boolean), `${results.filter(Boolean).length}/5`)
  const pc = parsePageConfig({ primaryColor: "red;}</style>", layout: "evil", showTOC: "yes" })
  ok(
    "非法枚举/类型回退默认值",
    pc.layout === "standard" && pc.primaryColor === "oklch(0.55 0.15 250)" && typeof pc.showTOC === "boolean"
  )
}

let cleaned = 0
for (const f of new Set(tempFiles)) {
  try {
    if (fs.existsSync(f)) {
      fs.unlinkSync(f)
      cleaned++
    }
  } catch {
    /* ignore */
  }
}
console.log(`\n（已清理 ${cleaned} 个临时文件）`)

console.log(`\n════════ 回归结果：${pass} 通过 / ${fail} 失败 ════════`)
if (fail) {
  console.log("失败项：\n" + failures.map((f) => "  - " + f).join("\n"))
  process.exit(1)
}
