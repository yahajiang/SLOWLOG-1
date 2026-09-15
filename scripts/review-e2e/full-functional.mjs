// 全功能只读扫描（三端页面 / 公开 API / 中间件分流 / 安全头 / SEO 产物）
// 用法：node scripts/review-e2e/full-functional.mjs [BASE_URL]（默认 http://127.0.0.1:3000）
//
// 设计约束：
//   ① **只读** —— 不写库、不建夹具、不触媒体，可对任意环境（含生产）安全运行；
//   ② 内容标记区分三端：移动树 data-m="1"（MHome/MArchive/MPost/MLogin 根节点）、
//      平板树 "bottom-3 left-3"（/t 三页独有 DesktopEscape 容器）、桌面树两者皆无；
//   ③ 写路径（POST/PUT/DELETE 成功流）不在此覆盖 —— 见 scripts/api-tests.mjs 六场景。
const BASE = process.argv[2] || "http://127.0.0.1:3000"

let pass = 0, fail = 0
const failures = []
function t(name, cond, extra = "") {
  cond ? pass++ : fail++
  if (!cond) failures.push(`${name} ${extra}`)
  console.log(`${cond ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`)
}

function jarFrom(res, jar) {
  for (const c of res.headers.getSetCookie?.() || []) {
    const [pair] = c.split(";")
    const [name, ...rest] = pair.split("=")
    jar.set(name.trim(), rest.join("="))
  }
}
const cookieOf = (jar) => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ")

const UA_PHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
const UA_TABLET = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1"

async function get(path, opts = {}) {
  return fetch(`${BASE}${path}`, { redirect: "manual", ...opts })
}

async function main() {
  // ═══ 前置：取一篇真实文章与一个真实标签 ═══
  const postsRes = await get("/api/posts")
  const posts = await postsRes.json()
  t("前置：/api/posts 返回非空数组", Array.isArray(posts) && posts.length > 0, `got ${posts.length}`)
  const slug = posts[0]?.slug
  const tag = (posts[0]?.tags || [])[0]
  t("前置：文章含 slug", !!slug, slug || "")
  t("前置：文章含标签", !!tag, tag || "")

  // ═══ A. 桌面树 ═══
  {
    const r = await get("/")
    const html = await r.text()
    t("A1 桌面首页 200", r.status === 200, `got ${r.status}`)
    t("A2 首页品牌词", html.includes("慢日志"))
    t("A3 首页渲染分类中文描述（descriptionZh 新链路）", html.includes("海报、排版、字体、视觉传达"))
    t("A4 首页无移动/平板标记", !html.includes('data-m="1"') && !html.includes("bottom-3 left-3"))
    const n = (html.match(/max-w-2xl/g) || []).length
    t("A5 分组头描述行数量 >0", n > 0, `got ${n}`)
  }
  {
    const r = await get("/archive")
    const html = await r.text()
    t("A6 归档页 200", r.status === 200, `got ${r.status}`)
    t("A7 归档页含文章标题", html.includes(posts[0]?.titleZh || posts[0]?.title || ""))
  }
  {
    const r = await get(`/posts/${slug}`)
    const html = await r.text()
    t("A8 阅读页 200", r.status === 200, `got ${r.status}`)
    t("A9 阅读页 JSON-LD", html.includes('application/ld+json'))
    t("A10 阅读页 canonical 指向 /posts/", /rel="canonical" href="[^"]*\/posts\//.test(html))
    t("A11 阅读页无移动标记", !html.includes('data-m="1"'))
  }
  {
    const r = await get(`/tag/${encodeURIComponent(tag)}`)
    t("A12 标签聚合页 200", r.status === 200, `got ${r.status}`)
  }
  {
    const r = await get("/login")
    t("A13 登录页 200", r.status === 200, `got ${r.status}`)
  }

  // ═══ B. SEO 产物 ═══
  {
    const r = await get("/rss.xml")
    const xml = await r.text()
    t("B1 RSS 200", r.status === 200, `got ${r.status}`)
    t("B2 RSS content-type 为 xml", (r.headers.get("content-type") || "").includes("xml"))
    t("B3 RSS 含 <rss 与 <item>", xml.includes("<rss") && xml.includes("<item>"))
    t("B4 RSS 含最新文章标题", xml.includes(posts[0]?.title || ""))
  }
  {
    const r = await get("/sitemap.xml")
    const xml = await r.text()
    t("B5 sitemap 200 且含 <urlset", r.status === 200 && xml.includes("<urlset"), `got ${r.status}`)
    // sitemap 与 canonical、JSON-LD 同用 /posts/<id> 形态（slug 是双兼容别名）
    t("B6 sitemap 含文章地址（/posts/<id>）", xml.includes(`/posts/${posts[0]?.id}`))
  }
  {
    const r = await get("/manifest.webmanifest")
    const j = await r.json().catch(() => null)
    t("B7 manifest 200 且可解析", r.status === 200 && !!j && typeof j.name === "string", `got ${r.status}`)
  }
  {
    const r = await get(`/posts/${slug}/opengraph-image`)
    t("B8 OG 图 200 且为图片", r.status === 200 && (r.headers.get("content-type") || "").startsWith("image/"), `got ${r.status} ${r.headers.get("content-type")}`)
  }

  // ═══ C. 公开 API ═══
  {
    t("C1 匿名列表均为 published", posts.every((p) => p.status === "published"))
    t("C2 列表项不泄漏 content 大字段", posts.every((p) => !("content" in p)))
    const r2 = await get("/api/posts?page=1")
    t("C3 分页返回 X-Total-Count", !!r2.headers.get("x-total-count"), r2.headers.get("x-total-count") || "")
    t("C4 未达上界不带 X-Truncated（17<60）", !r2.headers.get("x-truncated"))
    const acc = (r2.headers.get("cache-control") || "").toLowerCase()
    t("C5 匿名列表缓存 s-maxage=60", acc.includes("s-maxage=60"), `"${acc}"`)
  }
  {
    const r = await get("/api/categories")
    const cats = await r.json()
    t("C6 分类列表 200 且非空", r.status === 200 && Array.isArray(cats) && cats.length > 0)
    t("C7 分类含 descriptionZh 键", Array.isArray(cats) && cats.every((c) => "descriptionZh" in c))
    t("C8 分类计数含 _count", Array.isArray(cats) && cats.every((c) => "_count" in c))
  }
  {
    const r = await get("/api/thoughts")
    t("C9 随想列表 200", r.status === 200 && Array.isArray(await r.json()), `got ${r.status}`)
  }
  {
    const r = await get("/api/search-index")
    const j = await r.json()
    t("C10 搜索索引 200 且含 posts", r.status === 200 && Array.isArray(j.posts) && j.posts.length > 0)
    t("C11 搜索索引含拼音字段", j.posts?.[0] && "py" in j.posts[0] && "abbr" in j.posts[0])
  }
  {
    const r = await get("/api/settings")
    t("C12 设置公开读 200", r.status === 200, `got ${r.status}`)
  }
  {
    const r = await get("/api/media")
    t("C13 媒体匿名 → 401", r.status === 401, `got ${r.status}`)
  }
  {
    const r = await get("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
    t("C14 匿名新建 → 401", r.status === 401, `got ${r.status}`)
  }
  {
    const r = await get("/api/posts/not-exist-id")
    t("C15 不存在文章 → 404", r.status === 404, `got ${r.status}`)
  }

  // ═══ D. 中间件：UA 分流 / 守卫 / 兼容跳转 ═══
  {
    const r = await get("/", { headers: { "user-agent": UA_PHONE } })
    const html = await r.text()
    t("D1 手机 UA 首页 rewrite 到移动树（URL 不变）", r.status === 200 && html.includes('data-m="1"'), `got ${r.status}`)
  }
  {
    const r = await get(`/posts/${slug}`, { headers: { "user-agent": UA_PHONE } })
    const html = await r.text()
    t("D2 手机 UA 阅读页 rewrite 到 /m/posts", r.status === 200 && html.includes('data-m="1"'))
  }
  {
    const r = await get("/", { headers: { "user-agent": UA_TABLET } })
    const html = await r.text()
    t("D3 平板 UA 首页 rewrite 到 /t", r.status === 200 && html.includes("bottom-3 left-3"))
    t("D4 平板树无移动标记", !html.includes('data-m="1"'))
  }
  {
    const r = await get("/", { headers: { "user-agent": UA_PHONE, cookie: "view=desktop" } })
    const html = await r.text()
    t("D5 view=desktop cookie 跳过移动分流", r.status === 200 && !html.includes('data-m="1"'))
  }
  {
    const r = await get("/", { headers: { "user-agent": UA_TABLET, cookie: "view=desktop" } })
    const html = await r.text()
    t("D6 view=desktop 跳过平板分流", r.status === 200 && !html.includes("bottom-3 left-3"))
  }
  {
    const r = await get("/dashboard")
    t("D7 匿名后台 → 307 /login", r.status === 307 && (r.headers.get("location") || "").endsWith("/login"), `got ${r.status} ${r.headers.get("location")}`)
  }
  {
    const r = await get("/m/dashboard")
    t("D8 匿名移动后台 → 307 /m/login", r.status === 307 && (r.headers.get("location") || "").endsWith("/m/login"), `got ${r.status} ${r.headers.get("location")}`)
  }
  {
    const r = await get("/m/change-password")
    t("D9 匿名移动改密页 → 307 /m/login（N-7 新守卫）", r.status === 307 && (r.headers.get("location") || "").endsWith("/m/login"), `got ${r.status} ${r.headers.get("location")}`)
  }
  {
    const r = await get("/admin")
    t("D10 /admin 兼容跳转 → 307 /dashboard", r.status === 307 && (r.headers.get("location") || "").includes("/dashboard"), `got ${r.status} ${r.headers.get("location")}`)
  }
  {
    const r = await get("/m/login")
    const html = await r.text()
    t("D11 移动登录页 200", r.status === 200 && html.includes('data-m="1"'))
  }
  {
    const r = await get("/m")
    t("D12 /m 200", r.status === 200, `got ${r.status}`)
    const r2 = await get("/m/archive")
    t("D13 /m/archive 200", r2.status === 200, `got ${r2.status}`)
    const r3 = await get(`/m/posts/${slug}`)
    t("D14 /m/posts/[slug] 200", r3.status === 200, `got ${r3.status}`)
  }
  {
    const r = await get("/t")
    t("D15 /t 200", r.status === 200, `got ${r.status}`)
    const r2 = await get("/t/archive")
    t("D16 /t/archive 200", r2.status === 200, `got ${r2.status}`)
    const r3 = await get(`/t/posts/${slug}`)
    t("D17 /t/posts/[slug] 200", r3.status === 200, `got ${r3.status}`)
  }

  // ═══ E. 安全与缓存响应头 ═══
  {
    const r = await get("/")
    const h = r.headers
    const csp = h.get("content-security-policy") || ""
    t("E1 CSP 含 object-src 'none'", csp.includes("object-src 'none'"))
    t("E2 CSP 含 frame-ancestors 'none'", csp.includes("frame-ancestors 'none'"))
    t("E3 X-Frame-Options DENY", h.get("x-frame-options") === "DENY")
    t("E4 X-Content-Type-Options nosniff", h.get("x-content-type-options") === "nosniff")
    t("E5 Referrer-Policy 生效", !!h.get("referrer-policy"))
    t("E6 已废弃的 X-XSS-Protection 不再下发", !h.get("x-xss-protection"))
  }

  // ═══ F. 404（三端详情页 + 标签页必须真 404，soft-404=200 是回归信号）═══
  {
    const r = await get("/posts/definitely-not-exist")
    t("F1 桌面不存在文章页 → 404", r.status === 404, `got ${r.status}`)
    const r2 = await get("/this-page-does-not-exist")
    t("F2 不存在路径 → 404", r2.status === 404, `got ${r2.status}`)
    const r3 = await get("/m/posts/definitely-not-exist")
    t("F3 移动不存在文章页 → 404", r3.status === 404, `got ${r3.status}`)
    const r4 = await get("/t/posts/definitely-not-exist")
    t("F4 平板不存在文章页 → 404", r4.status === 404, `got ${r4.status}`)
    const r5 = await get("/tag/definitely-not-exist")
    t("F5 无文章标签页 → 404", r5.status === 404, `got ${r5.status}`)
  }

  console.log(`\n===== 全功能只读扫描：${pass} 通过 / ${fail} 失败 =====`)
  if (failures.length) { console.log(failures.join("\n")); process.exit(1) }
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(2) })
