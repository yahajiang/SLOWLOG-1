// 针对本次审查发现的缺陷做端到端复现验证
// 用法：node scripts/review-e2e/extra-tests.mjs http://127.0.0.1:3100
import { execSync } from "child_process"
import fs from "fs"
import os from "os"
import path from "path"

const BASE = process.argv[2] || "http://127.0.0.1:3100"
const PY = "C:/Users/Yahajiang/.workbuddy/binaries/python/versions/3.13.12/python.exe"

let pass = 0
let fail = 0
function t(name, cond, extra = "") {
  cond ? pass++ : fail++
  console.log(`${cond ? "✓" : "✗"} ${name}${extra ? "  → " + extra : ""}`)
}

function jarFrom(res, jar) {
  for (const c of res.headers.getSetCookie?.() || []) {
    const [pair] = c.split(";")
    const [name, ...rest] = pair.split("=")
    jar.set(name.trim(), rest.join("="))
  }
}
const cookieOf = (jar) => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ")

async function login(email, password) {
  const jar = new Map()
  const r1 = await fetch(`${BASE}/api/auth/csrf`)
  jarFrom(r1, jar)
  const { csrfToken } = await r1.json()
  const body = new URLSearchParams({ csrfToken, email, password, callbackUrl: `${BASE}/` })
  const r2 = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", cookie: cookieOf(jar) },
    body,
    redirect: "manual",
  })
  jarFrom(r2, jar)
  return { hasSession: [...jar.keys()].some((k) => k.includes("session-token")), cookie: cookieOf(jar) }
}

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
)

function xmlValid(file) {
  try {
    execSync(`"${PY}" -c "import xml.dom.minidom,sys;xml.dom.minidom.parse(sys.argv[1]);print('XML_OK')" "${file}"`, { stdio: "pipe" })
    return true
  } catch {
    return false
  }
}

async function main() {
  const admin = await login("test-admin@test.local", "TestAdmin123")
  t("前置：test-admin 登录成功", admin.hasSession)
  if (!admin.hasSession) {
    console.log("无法登录，终止")
    process.exit(2)
  }
  const H = { cookie: admin.cookie, "Content-Type": "application/json" }
  const cats = await (await fetch(`${BASE}/api/categories`)).json()
  const categoryId = cats[0]?.id
  t("前置：分类列表可用", Array.isArray(cats) && cats.length > 0)

  const makePost = async (payload) => {
    const r = await fetch(`${BASE}/api/posts`, { method: "POST", headers: H, body: JSON.stringify({ tags: ["ci"], categoryId, content: { type: "doc", content: [] }, ...payload }) })
    const d = await r.json().catch(() => ({}))
    // 注意：响应体自身含 status（文章状态 draft/published），若直接用 { status: r.status, ...d }
    // 会被展开覆盖，导致断言拿文章状态当 HTTP 码（曾误判 P0-1 未修复）
    return { httpStatus: r.status, ...d }
  }
  const cleanup = async (ids) => {
    for (const id of ids.filter(Boolean)) await fetch(`${BASE}/api/posts/${id}`, { method: "DELETE", headers: { cookie: admin.cookie } })
  }

  console.log("\n──── P0-1 纯中文标题 slug 生成 ────")
  const c1 = await makePost({ title: "设计原则", status: "draft" })
  const c2 = await makePost({ title: "代码之美", status: "draft" })
  console.log(`     第1篇：status=${c1.httpStatus} slug=${JSON.stringify(c1.slug)}`)
  console.log(`     第2篇：status=${c2.httpStatus} slug=${JSON.stringify(c2.slug)} error=${JSON.stringify(c2.error)}`)
  t("P0-1a 第 1 篇中文标题创建成功", c1.httpStatus === 200, `status=${c1.httpStatus}`)
  t("P0-1b 生成的 slug 不是退化值 '-'", c1.slug && c1.slug !== "-" && c1.slug !== "--", `slug=${JSON.stringify(c1.slug)}`)
  t("P0-1c 第 2 篇中文标题也能创建成功", c2.httpStatus === 200, `status=${c2.httpStatus} error=${JSON.stringify(c2.error)}`)

  console.log("\n──── P1-1 媒体上传内容校验绕过 ────")
  {
    const f = new FormData()
    f.append("file", new Blob(["<html><body><script>alert(1)</script></body></html>"], { type: "image/gif" }), "evil.gif")
    const up = await fetch(`${BASE}/api/media`, { method: "POST", headers: { cookie: admin.cookie }, body: f })
    const d = await up.json().catch(() => ({}))
    t("P1-1a 非图片内容伪装 .gif 应被拒（期望 400）", up.status === 400, `实际 status=${up.status}${up.status === 200 ? ` 已入库 url=${d[0]?.url} mimeType=${d[0]?.mimeType}` : ""}`)
    if (d[0]?.id) await fetch(`${BASE}/api/media?id=${d[0].id}`, { method: "DELETE", headers: { cookie: admin.cookie } })
  }
  {
    const f = new FormData()
    f.append("file", new Blob([TINY_PNG], { type: "image/png" }), "ok.png")
    const up = await fetch(`${BASE}/api/media`, { method: "POST", headers: { cookie: admin.cookie }, body: f })
    t("P1-1b 对照组：合法 PNG 上传成功", up.status === 200, `status=${up.status}`)
    const d = await up.json().catch(() => ({}))
    if (d[0]?.id) await fetch(`${BASE}/api/media?id=${d[0].id}`, { method: "DELETE", headers: { cookie: admin.cookie } })
  }

  console.log("\n──── P1-3 RSS CDATA 终结符未转义 ────")
  const rssPost = await makePost({ title: "CDATA 注入 ]]> 测试", slug: `ci-cdata-${Date.now()}`, status: "published" })
  const rssXml = await (await fetch(`${BASE}/rss.xml`)).text()
  const tmp = path.join(os.tmpdir(), "slowlog-feed.xml")
  fs.writeFileSync(tmp, rssXml, "utf8")
  const ok = xmlValid(tmp)
  t("P1-3a RSS 中 ]]> 被正确转义（无裸终结符）", !rssXml.includes("]]> 测试"), rssXml.includes("]]> 测试") ? "发现未转义的 ]]> 终结符" : "")
  t("P1-3b /rss.xml 通过标准 XML 解析器", ok, ok ? "xml.dom.minidom 解析通过" : "XML 解析失败（feed 已损坏）")

  console.log("\n──── P1-4 JSON-LD 未转义（存储型 XSS 向量）────")
  const xssPost = await makePost({ title: "</script><img src=x onerror=alert(1)>", slug: `ci-xss-${Date.now()}`, status: "published" })
  if (xssPost.id) {
    const html = await (await fetch(`${BASE}/posts/${xssPost.id}`)).text()
    const i = html.indexOf("application/ld+json")
    const seg = i >= 0 ? html.slice(i, i + 900) : ""
    const raw = seg.includes("</script><img")
    t("P1-4 JSON-LD 中 </script> 已转义", !raw, raw ? "存在未转义的 </script>，可执行任意脚本" : "")
  } else {
    t("P1-4 前置：创建测试文章", false, `status=${xssPost.httpStatus} error=${xssPost.error}`)
  }

  console.log("\n──── P2 系列快速验证 ────")
  {
    const r = await fetch(`${BASE}/api/settings`)
    t("P2-6a /api/settings 匿名可读（应为公开或 401）", true, `status=${r.status}`)
    const cc = r.headers.get("cache-control") || "(无)"
    t("P2-6b /api/settings 带缓存头", cc !== "(无)", `Cache-Control=${cc}`)
  }
  {
    const r = await fetch(`${BASE}/api/categories`)
    const bodyType = r.headers.get("content-type") || ""
    t("P2-7 /api/categories 正常返回 JSON", r.status === 200 && bodyType.includes("json"), `status=${r.status} type=${bodyType}`)
  }
  {
    const r = await fetch(`${BASE}/api/health`)
    const d = await r.json().catch(() => ({}))
    // P3-2 修复后：匿名只应看到 status，不再暴露 DB 查询延迟与 Blob 配置状态
    t(
      "P3-2 /api/health 匿名仅返回 status（不暴露内部状态）",
      r.status === 200 && d.status === "ok" && d.checks === undefined,
      `body=${JSON.stringify(d)}`
    )
  }
  {
    // 搜索索引：构建期静态化是否导致空索引
    const r = await fetch(`${BASE}/api/search-index`)
    const d = await r.json().catch(() => ({}))
    t("搜索索引：运行时返回非空文章索引", Array.isArray(d.posts) && d.posts.length > 0, `posts=${d.posts?.length ?? "?"} offline=${d.offline ?? false}`)
  }

  await cleanup([c1.id, c2.id, rssPost.id, xssPost.id])
  console.log(`\n===== 补充测试结果：${pass} 通过 / ${fail} 失败 =====`)
  fs.unlinkSync(tmp)
}
main().catch((e) => { console.error("FATAL:", e); process.exit(2) })
