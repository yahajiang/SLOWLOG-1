#!/usr/bin/env node
/** App companion API smoke — BASE default http://127.0.0.1:3010 */
const BASE = process.argv[2] || "http://127.0.0.1:3010"
const EMAIL = process.env.SMOKE_EMAIL || "test-admin@test.local"
const PASSWORD = process.env.SMOKE_PASSWORD || "TestAdmin123"
let pass = 0, fail = 0
const fails = []

/**
 * 本次冒烟创建的资源，跑完必须清掉。
 *
 * ⚠️ 历史教训：本脚本原先**只创建、不清理**，直接跑在生产库上
 * （Neon `neondb@ep-ancient-meadow-b3sx8pyw`），留下 4 条
 * `smoke-thought-app-companion` 随想 + 4 条 `smoke-*` 令牌 + 4 条
 * `smoke-fcm-*` 设备（2026-09-18，已于 2026-09-19 手工清理）。
 * 任何写接口的冒烟都**必须**在 finally 里回收，否则测一次脏一次。
 */
const created = { notes: [], tokens: [], devices: [], posts: [] }

function t(name, cond, extra = "") {
  if (cond) { pass++; console.log("OK", name, extra) }
  else { fail++; fails.push(name + " " + extra); console.log("NG", name, extra) }
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

/**
 * 回收本次冒烟创建的资源。
 *
 * 只删**本次 run 记录下的 ID**，不做任何按前缀/内容扫描的批量删除——
 * 冒烟脚本没有资格对生产库做模式匹配删除（这正是上次脏数据的成因之一）。
 */
async function cleanup(bearerToken, sessionCookie) {
  if (!bearerToken && !sessionCookie) return
  const note = []
  const hdr = bearerToken ? { Authorization: `Bearer ${bearerToken}` } : { cookie: sessionCookie }

  for (const id of created.notes) {
    const r = await fetch(`${BASE}/api/thoughts/${id}`, { method: "DELETE", headers: hdr }).catch(() => null)
    note.push(`note ${id}: ${r ? r.status : "err"}`)
  }
  // 设备：走注销接口（若不存在则跳过，不报错）
  for (const id of created.devices) {
    const r = await fetch(`${BASE}/api/app/devices?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: hdr,
    }).catch(() => null)
    note.push(`device ${id}: ${r ? r.status : "err"}`)
  }
  // 草稿文章：脚本流程里已随 tombstone 用例删除，这里兜底（404/已删不算失败）
  for (const id of created.posts) {
    const r = await fetch(`${BASE}/api/posts/${id}`, { method: "DELETE", headers: hdr }).catch(() => null)
    note.push(`post ${id}: ${r ? r.status : "err"}`)
  }
  console.log("CLEANUP " + (note.length ? note.join(" | ") : "(nothing to clean)"))
}

async function main() {
  let bearerToken = null
  let sessionCookie = null
  try {
    const result = await run((tok, ck) => { bearerToken = tok; sessionCookie = ck })
    return result
  } finally {
    // ⚠️ 无论断言是否失败、是否抛异常，都必须回收——否则生产库又被污染
    await cleanup(bearerToken, sessionCookie)
  }
}

async function run(remember) {
  let r = await fetch(`${BASE}/api/app/tokens`)
  t("tokens unauth 401", r.status === 401, String(r.status))

  r = await fetch(`${BASE}/api/app/sync`)
  t("sync public 200", r.status === 200, String(r.status))
  const sync = await r.json()
  t("sync has postsChanged", Array.isArray(sync.postsChanged))
  t("sync has deletedIds", Array.isArray(sync.deletedIds))
  t("sync has settings", !!sync.settings?.siteName)
  t("sync has serverTime", !!sync.serverTime)
  const guestWithContent = (sync.postsChanged || []).some((p) => p.content !== undefined)
  t("sync guest no content field", !guestWithContent)

  r = await fetch(`${BASE}/api/app/sync?since=${new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString()}`)
  t("sync since>90d 400", r.status === 400, String(r.status))

  r = await fetch(`${BASE}/api/app/sync?since=not-a-date`)
  t("sync invalid since full mode 200", r.status === 200, String(r.status))
  const syncBad = await r.json().catch(() => ({}))
  t("sync invalid since has postsChanged", Array.isArray(syncBad.postsChanged))

  const postsRes = await fetch(`${BASE}/api/posts`)
  const posts = await postsRes.json()
  const first = posts[0]
  t("has public post", !!first?.id)
  if (first) {
    r = await fetch(`${BASE}/api/covers/${first.id}?w=800&v=smoke`)
    t("cover 200", r.status === 200, String(r.status))
    t("cover png", (r.headers.get("content-type") || "").includes("image/png"))
    t("cover immutable", (r.headers.get("cache-control") || "").includes("immutable"))
    const buf = Buffer.from(await r.arrayBuffer())
    t("cover png magic", buf[0] === 0x89 && buf[1] === 0x50)
    r = await fetch(`${BASE}/api/covers/${first.id}?w=1600`)
    const buf2 = Buffer.from(await r.arrayBuffer())
    t("cover w=1600", r.status === 200 && buf2.length > buf.length * 2)
  }

  r = await fetch(`${BASE}/privacy`)
  t("privacy page 200", r.status === 200, String(r.status))

  const loginInfo = await login(EMAIL, PASSWORD)
  t("login has session", loginInfo.hasSession, EMAIL)

  if (!loginInfo.hasSession) {
    console.log(`RESULT pass=${pass} fail=${fail}`)
    // ⚠️ 这里不能 process.exit——会让 finally 里的 cleanup 不执行。
    // 改为 return 退出码，由 main 的调用方决定进程状态。
    return fail ? 1 : 0
  }

  r = await fetch(`${BASE}/api/app/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: loginInfo.cookie },
    body: JSON.stringify({ name: `smoke-${Date.now()}` }),
  })
  const tokenJson = await r.json()
  t("token create 200", r.status === 200, JSON.stringify(tokenJson).slice(0, 80))
  t("token has plaintext", typeof tokenJson.token === "string" && tokenJson.token.length >= 32)

  r = await fetch(`${BASE}/api/app/tokens`, { headers: { cookie: loginInfo.cookie } })
  const list = await r.json()
  t("token list no hash", !JSON.stringify(list).includes("tokenHash"))
  t("token list has name", Array.isArray(list) && list.some((x) => x.id === tokenJson.id))

  const bearer = { Authorization: `Bearer ${tokenJson.token}` }
  // 把凭据交给外层，供 finally 里的 cleanup 使用
  remember(tokenJson.token, loginInfo.cookie)

  r = await fetch(`${BASE}/api/app/sync`, { headers: bearer })
  const syncB = await r.json()
  t("sync bearer 200", r.status === 200)
  t("sync bearer has posts", Array.isArray(syncB.postsChanged))
  t("sync bearer settings", !!syncB.settings)

  r = await fetch(`${BASE}/api/thoughts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...bearer },
    body: JSON.stringify({ textZh: "smoke-thought-app-companion" }),
  })
  const thought = await r.json()
  if (thought?.id) created.notes.push(thought.id)
  t("thought create via bearer", r.status === 200 && !!thought.id, JSON.stringify(thought).slice(0, 80))

  r = await fetch(`${BASE}/api/app/devices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...bearer },
    body: JSON.stringify({ fcmToken: `smoke-fcm-${Date.now()}`, platform: "android" }),
  })
  const dev = await r.json()
  if (dev?.id) created.devices.push(dev.id)
  t("device upsert bearer", r.status === 200 && !!dev.id, JSON.stringify(dev).slice(0, 80))

  const cats = await (await fetch(`${BASE}/api/categories`)).json()
  const categoryId = cats[0]?.id

  r = await fetch(`${BASE}/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...bearer },
    body: JSON.stringify({
      title: "Smoke Draft App Companion",
      tags: ["smoke"],
      status: "draft",
      categoryId,
      excerpt: "draft for cover auth check",
      content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x" }] }] },
    }),
  })
  const postJson = await r.json().catch(() => ({}))
  if (postJson?.id) created.posts.push(postJson.id)
  t("post draft via bearer", r.status === 200 && !!postJson.id, `status=${r.status} ${JSON.stringify(postJson).slice(0, 80)}`)
  if (r.status === 200 && postJson.id) {
    r = await fetch(`${BASE}/api/covers/${postJson.id}`)
    t("draft cover guest 404", r.status === 404, String(r.status))
    r = await fetch(`${BASE}/api/covers/${postJson.id}`, { headers: bearer })
    t("draft cover bearer 200", r.status === 200, String(r.status))

    // tombstone via bearer delete
    r = await fetch(`${BASE}/api/posts/${postJson.id}`, { method: "DELETE", headers: bearer })
    t("post delete via bearer", r.status === 200, String(r.status))
    r = await fetch(`${BASE}/api/app/sync`, { headers: bearer })
    const syncAfter = await r.json()
    t("sync sees tombstone", (syncAfter.deletedIds || []).includes(postJson.id), JSON.stringify(syncAfter.deletedIds || []).slice(0, 80))
  }

  r = await fetch(`${BASE}/api/app/tokens?id=${encodeURIComponent(tokenJson.id)}`, {
    method: "DELETE",
    headers: { cookie: loginInfo.cookie },
  })
  t("token revoke", r.ok)

  r = await fetch(`${BASE}/api/thoughts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...bearer },
    body: JSON.stringify({ textZh: "should-fail" }),
  })
  t("write after revoke 401", r.status === 401, String(r.status))

  console.log(`RESULT pass=${pass} fail=${fail}`)
  if (fails.length) console.log("FAILURES:\n" + fails.join("\n"))
  // 不 process.exit：让 main 的 finally 完成 cleanup
  return fail ? 1 : 0
}

main()
  .then((code) => { process.exit(code ?? 0) })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
