// 核心场景 API 集成测试（后端审查第 3 阶段）
// 用法：node scripts/api-tests.mjs [BASE_URL]（默认 http://127.0.0.1:3000）
// 前置：scripts/api-tests-fixtures.mjs 已运行（测试账户就位）
// 覆盖六场景：①登录限流 ②改密（当前密码+两次确认）③草稿保护 ④定时发布 ⑤缓存隔离 ⑥上传校验
const BASE = process.argv[2] || "http://127.0.0.1:3000"

let pass = 0, fail = 0
const failures = []
function t(name, cond, extra = "") {
  cond ? pass++ : fail++
  if (!cond) failures.push(`${name} ${extra}`)
  console.log(`${cond ? "✓" : "✗"} ${name}${extra ? "  " + extra : ""}`)
}

// ── cookie jar（极简）──
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
  const hasSession = [...jar.keys()].some((k) => k.includes("session-token"))
  return { hasSession, cookie: cookieOf(jar) }
}

// 1×1 透明 PNG
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
)

async function main() {
  // ═══ 场景 ②：改密（当前密码 + 两次确认）═══
  {
    const l = await login("change-user@test.local", "ChangePass123")
    t("改密前置：change-user 可登录", l.hasSession)
    const post = async (payload) =>
      fetch(`${BASE}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: l.cookie },
        body: JSON.stringify(payload),
      })
    let r = await post({ currentPassword: "WrongOld1", email: "change-user@test.local", password: "ChangePass456", name: "CI", confirmPassword: "ChangePass456" })
    t("改密：当前密码错误 → 403", r.status === 403, `got ${r.status}`)
    r = await post({ currentPassword: "ChangePass123", email: "change-user@test.local", password: "ChangePass456", name: "CI", confirmPassword: "Different999" })
    t("改密：两次新密码不一致 → 400", r.status === 400, `got ${r.status}`)
    r = await post({ currentPassword: "ChangePass123", email: "change-user@test.local", password: "ChangePass456", name: "CI", confirmPassword: "ChangePass456" })
    const d = await r.json()
    t("改密：正确流程 → ok", r.status === 200 && d.ok === true, `got ${r.status}`)
    const re = await login("change-user@test.local", "ChangePass456")
    t("改密：新密码可登录", re.hasSession)
  }

  // ═══ 场景 ⑥：登录限流（rate-user 专用，5 败后正确密码也应被锁）═══
  {
    for (let i = 1; i <= 5; i++) {
      await login("rate-user@test.local", `WrongPass${i}`)
    }
    const sixth = await login("rate-user@test.local", "RatePass123")
    t("限流：5 败后正确密码仍被锁", !sixth.hasSession)
  }

  // ═══ test-admin 登录（写场景前置）═══
  const admin = await login("test-admin@test.local", "TestAdmin123")
  t("test-admin 可登录", admin.hasSession)
  const adminHeaders = { cookie: admin.cookie, "Content-Type": "application/json" }

  // 预清理：上次运行的 ci 标记测试文章
  {
    const admin0 = await login("test-admin@test.local", "TestAdmin123")
    const list = await (await fetch(`${BASE}/api/posts`, { headers: { cookie: admin0.cookie } })).json()
    for (const old of list.filter((x) => (x.tags || []).includes("ci"))) {
      await fetch(`${BASE}/api/posts/${old.id}`, { method: "DELETE", headers: { cookie: admin0.cookie } })
    }
  }

  const catsRes = await fetch(`${BASE}/api/categories`)
  const cats = await catsRes.json()
  const categoryId = cats[0]?.id
  t("分类列表可用", Array.isArray(cats) && cats.length > 0)

  // ═══ 场景 ③：草稿保护 ═══
  let draftId = ""
  {
    const r = await fetch(`${BASE}/api/posts`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        title: "CI 草稿保护测试",
        slug: `ci-draft-${Date.now()}`,
        content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "draft-body" }] }] },
        categoryId,
        tags: ["ci"],
        status: "draft",
      }),
    })
    const d = await r.json()
    draftId = d.id || ""
    t("创建草稿 → 200", r.status === 200 && !!draftId, `got ${r.status}`)
    const anon = await fetch(`${BASE}/api/posts/${draftId}`)
    t("草稿保护：匿名 GET 详情 → 404", anon.status === 404, `got ${anon.status}`)
    const list = await (await fetch(`${BASE}/api/posts`)).json()
    t("草稿保护：匿名列表不含草稿", !list.some((x) => x.id === draftId))
    const adm = await fetch(`${BASE}/api/posts/${draftId}`, { headers: { cookie: admin.cookie } })
    t("草稿保护：管理员可见", adm.status === 200, `got ${adm.status}`)
  }

  // ═══ 场景 ④：定时发布（未来文章）═══
  let futureId = ""
  {
    const future = new Date(Date.now() + 3600 * 1000).toISOString()
    const r = await fetch(`${BASE}/api/posts`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        title: "CI 定时发布测试",
        slug: `ci-future-${Date.now()}`,
        content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "future-body" }] }] },
        categoryId,
        tags: ["ci"],
        status: "published",
        publishedAt: future,
      }),
    })
    const d = await r.json()
    futureId = d.id || ""
    t("创建未来文章 → 200", r.status === 200 && !!futureId, `got ${r.status} ${d.error || ""}`)
    const anon = await fetch(`${BASE}/api/posts/${futureId}`)
    t("定时发布：未到时间匿名 GET → 404", anon.status === 404, `got ${anon.status}`)
    const list = await (await fetch(`${BASE}/api/posts`)).json()
    t("定时发布：匿名列表不含未来文章", !list.some((x) => x.id === futureId))
  }

  // ═══ 场景 ⑤：缓存隔离（管理接口 private no-store）═══
  {
    const adm = await fetch(`${BASE}/api/posts`, { headers: { cookie: admin.cookie } })
    const cc = (adm.headers.get("cache-control") || "").toLowerCase()
    t("缓存隔离：管理员列表 private, no-store", cc.includes("private") && cc.includes("no-store"), `got "${cc}"`)
    const anon = await fetch(`${BASE}/api/posts`)
    const acc = (anon.headers.get("cache-control") || "").toLowerCase()
    t("缓存隔离：匿名列表无 private/no-store", !(acc.includes("private") && acc.includes("no-store")), `got "${acc}"`)
  }

  // ═══ 场景 ①：浏览计数（公开、仅已发布）═══
  {
    const r = await fetch(`${BASE}/api/posts`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        title: "CI 浏览计数测试",
        slug: `ci-view-${Date.now()}`,
        content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "views" }] }] },
        categoryId,
        tags: ["ci"],
        status: "published",
      }),
    })
    const d = await r.json()
    const pubId = d.id || ""
    t("浏览计数前置：创建已发布文章 → 200", r.status === 200 && !!pubId, `got ${r.status}`)
    const pub = await fetch(`${BASE}/api/posts/${pubId}/view`, { method: "POST" })
    t("浏览计数：已发布文章 → ok", pub.status === 200, `got ${pub.status}`)
    const miss = await fetch(`${BASE}/api/posts/not-exist-id/view`, { method: "POST" })
    t("浏览计数：不存在文章 → 404", miss.status === 404, `got ${miss.status}`)
    const detail = await (await fetch(`${BASE}/api/posts/${pubId}`)).json()
    t("浏览计数：viewCount ≥ 1", (detail.viewCount || 0) >= 1, `got ${detail.viewCount}`)
    await fetch(`${BASE}/api/posts/${pubId}`, { method: "DELETE", headers: { cookie: admin.cookie } })
  }

  // ═══ 清理草稿与未来文章（避免测试残留）═══
  for (const id of [draftId, futureId].filter(Boolean)) {
    await fetch(`${BASE}/api/posts/${id}`, { method: "DELETE", headers: { cookie: admin.cookie } })
  }

  // ═══ 场景 ⑥b：上传校验 ═══
  {
    const txt = await fetch(`${BASE}/api/media`, {
      method: "POST",
      headers: { cookie: admin.cookie },
      body: (() => {
        const f = new FormData()
        f.append("file", new Blob(["not an image"], { type: "text/plain" }), "a.txt")
        return f
      })(),
    })
    t("上传校验：非图片 MIME → 400", txt.status === 400, `got ${txt.status}`)
    const big = Buffer.alloc(5 * 1024 * 1024 + 1, 0)
    const oversized = await fetch(`${BASE}/api/media`, {
      method: "POST",
      headers: { cookie: admin.cookie },
      body: (() => {
        const f = new FormData()
        f.append("file", new Blob([big], { type: "image/png" }), "big.png")
        return f
      })(),
    })
    t("上传校验：超 5MB → 400", oversized.status === 400, `got ${oversized.status}`)
    const png = await fetch(`${BASE}/api/media`, {
      method: "POST",
      headers: { cookie: admin.cookie },
      body: (() => {
        const f = new FormData()
        f.append("file", new Blob([TINY_PNG], { type: "image/png" }), "tiny.png")
        return f
      })(),
    })
    const d = await png.json().catch(() => ({}))
    t("上传校验：合法 PNG → 200", png.status === 200, `got ${png.status}`)
    if (d[0]?.id) {
      const del = await fetch(`${BASE}/api/media?id=${d[0].id}`, { method: "DELETE", headers: { cookie: admin.cookie } })
      t("上传清理：删除测试媒体 → ok", del.status === 200, `got ${del.status}`)
    }
  }

  console.log(`\n===== API 集成测试：${pass} 通过 / ${fail} 失败 =====`)
  if (failures.length) { console.log(failures.join("\n")); process.exit(1) }
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(2) })
