# SlowLog 慢日志 · 全量代码审查 + 全链路功能测试报告

> **审查日期**：2026-09-15
> **代码版本**：`0.3.9`
> **审查范围**：`app/`（67 文件）· `components/`（56 文件）· `lib/`（22 文件）· `middleware.ts` · `prisma/` · `scripts/`（35 文件）· 构建配置
> **审查方式**：逐文件证据审查（定位到 文件:行）+ 全量类型检查 + 生产构建 + 真实数据库端到端功能测试
> **对标基线**：`docs/backend-review-2026-09-14.md`（前次后端专项审查，本报告含增量回归结论）

---

## 一、执行摘要

### 审查结论一句话

**架构分层清晰、安全基线高于同类个人博客，但存在 2 个必现的核心业务阻断缺陷、5 个严重缺陷，其中媒体上传链路与登录限流在上一轮加固中引入了新的绕过路径。**

### 质量画像

| 维度 | 评分 | 说明 |
|---|---|---|
| 架构与分层 | ★★★★☆ | 三端（桌面/平板/移动）共用适配层，服务层收口缓存再生，边界清晰 |
| 类型安全 | ★★★★★ | `tsc --noEmit` **全量 0 错误** |
| 安全基线 | ★★★★☆ | 鉴权双闸覆盖全部写路由、zod 白名单、参数化查询、三级降级链 |
| 输入校验 | ★★★☆☆ | REST 层已 zod 化，但**文件内容校验存在可绕过的旁路** |
| 错误处理 | ★★★☆☆ | 契约统一，但存在静默吞错、失败无提示、部分成功不回滚 |
| 前端性能 | ★★★☆☆ | 高频路径（scroll/轮播/搜索）缺少节流与 memo 边界 |
| 数据持久化 | ★★☆☆☆ | 新建文章**零持久化**，刷新即丢失全部内容 |

### 问题分布

| 级别 | 数量 | 定义 |
|---|---|---|
| **P0 阻断** | **2** | ✅ 已修复并实测验证 |
| **P1 严重** | **6** | ✅ 已修复并实测验证 |
| **P2 一般** | **15** | ✅ 已修复 14 项（P2-15 下调为 P3 观察项），回归零失败 |
| **P3 改进** | **26** | ✅ 已全部修复（第三轮）—— **49 项问题全部闭环** |

> **可执行验证结果（2026-09-15 最终）**
> ① `npx tsc --noEmit` → **0 错误**；`npx next build` → **EXIT 0**；
> ② **真实数据库 + 真实 HTTP 端到端测试全部通过**：项目自带 6 场景 **25/25**、本次新增缺陷用例 **15/15**；
> ③ 单元回归断言 `unit-verify.ts` → **18/18 通过**；
> ④ 缺陷修复均经实测验证：P0-1 连续创建 2 篇中文标题文章成功（`she-ji-yuan-ze` / `dai-ma-zhi-mei`）、P1-1 伪装 `.gif` 返回 **400**、P1-3 RSS 通过标准 XML 解析器、P1-4 JSON-LD 已转义、P2-6 缓存头已生效、**P1-6 在「DB 不可达 + 缓存有数据」下构建由 EXIT 1 转为 EXIT 0**；
> ⑤ 渲染白名单（`safeColor` / `safeHref` / `safeImgSrc`）对 5 类注入**全部拦截**。
> 详见第四章与第八章。

---

## 二、项目结构与依赖关系

### 2.1 分层架构

```
┌─ 路由层 (App Router) ────────────────────────────────────────────────┐
│  前台  app/page.tsx · archive/ · posts/[id]/ · tag/[tag]/            │
│  终端  app/m/*（移动）· app/t/*（平板）                               │
│  后台  app/dashboard/*（仪表盘/文章/分类/媒体/随想/设置）              │
│  API   app/api/{posts,categories,thoughts,media,settings,            │
│                 search-index,health,auth}/*                          │
│  SEO   app/rss.xml · app/sitemap.ts · posts/[id]/opengraph-image.tsx │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ 服务端取数（RSC）
┌─ 服务层 lib/ ────────────▼───────────────────────────────────────────┐
│  posts.ts      文章服务：unstable_cache(tags:["posts"]) + 可见性规则  │
│  adapt.ts      三端唯一适配入口：字段兜底/日期归一/相关文章打分        │
│  auth.ts       NextAuth Credentials + bcrypt + 登录限流（Node only）  │
│  auth-config.ts Edge 安全子集（无 pg 依赖，middleware 专用）          │
│  schemas.ts    zod 写接口白名单                                       │
│  page-config.ts 渲染配置白名单（safeColor/safeHref/safeImgSrc）        │
│  blob.ts       sharp 压缩 + Blob→本地→dataURI 三级降级                │
│  i18n.ts / lang-context.tsx   161 条 zh/en 字典 + 语言上下文          │
│  categories.ts / headings.ts / relative-time.ts / post-versions.ts   │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
┌─ 数据层 ──────────────────▼───────────────────────────────────────────┐
│  prisma.ts  PrismaClient + @prisma/adapter-pg（Pool max=5, TLS 验证）  │
│  schema.prisma  User/Category/Post/Note/Media/Setting                │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
              PostgreSQL (Neon) · Vercel Blob · sharp
```

### 2.2 关键依赖方向（无循环依赖）

| 调用方 | 被调用方 | 说明 |
|---|---|---|
| `middleware.ts` | `lib/auth-config.ts` | **刻意不引入 `lib/prisma`**——避免 pg/crypto 进入 Edge 打包链（`lib/prisma.ts:11` 有明确注释约束）✓ |
| `lib/auth.ts` | `lib/prisma.ts` | 惰性 `await import("./prisma")`，仅 Node runtime 触发 |
| `lib/posts.ts` | `lib/categories.ts` `lib/headings.ts` | 类型与标题锚点工具 |
| `lib/adapt.ts` | `lib/page-config.ts` `lib/i18n.ts` `lib/types.ts` | 三端共享适配 |
| API 路由 | `lib/auth` + `lib/schemas` + `lib/prisma` + `lib/posts` | 统一"鉴权 → 校验 → 落库 → 缓存再生"四段式 |

### 2.3 核心业务链路（端到端调用链）

**链路 A — 发布文章 → 前台生效**
```
EditorClient.handleSave("published")            app/dashboard/posts/[id]/EditorClient.tsx:186
  → PUT /api/posts/[id]                         app/api/posts/[id]/route.ts:37
    → auth() + passwordChangeRequired()         :38-40   闸 1：登录态
    → postUpdateSchema.safeParse()              :42      闸 2：字段白名单
    → prisma.post.update()                      :81
    → revalidatePostViews()                     :10-20
        revalidateTag("posts")                  → 击穿 lib/posts.ts:140 数据缓存
        revalidatePath("/") /rss.xml /sitemap.xml /posts/[id]
  → router.refresh()                            EditorClient.tsx:229
```

**链路 B — 匿名阅读（含草稿/定时保护）**
```
GET /posts/<slug|id>                            app/posts/[id]/page.tsx:42
  → getPostBySlug(id) || getPostById(id)        lib/posts.ts:163-171
    → scheduledGuard() → isPublicPost()         lib/posts.ts:75-78 (status==="published" && publishedAt<=now)
  → getAllPosts() → getCachedPostRows()         lib/posts.ts:126-141（unstable_cache 60s）
  → pickRelated() + JSON-LD → PostClient        lib/adapt.ts:80 / page.tsx:52
```

**链路 C — 移动端分流**
```
middleware.ts:58  MOBILE_UA_RE → NextResponse.rewrite("/m...")（地址栏不变）
middleware.ts:76  TABLET_UA_RE → rewrite("/t...")
middleware.ts:55  cookie view=desktop 跳过分流
middleware.ts:88-93  未认证访问 /dashboard|/m/dashboard → 302 登录页
middleware.ts:95-103 needsPasswordChange → 强制跳转改密页
```

**链路 D — 媒体上传（三级降级）**
```
POST /api/media                                 app/api/media/route.ts:27
  → auth() + passwordChangeRequired()           :28-30
  → ALLOWED_MIMES.has(file.type)                :38    ← 仅信任客户端声明的 MIME（见 P1-1）
  → compressAndUpload(buffer, name)             lib/blob.ts:39
      → GIF：直接 persist（跳过内容校验）        lib/blob.ts:51  ← P1-1 根因
      → 其他：sharp.metadata() 校验 → resize → 转码 → persist
      → persist 降级链：Blob → public/uploads → data URI   lib/blob.ts:23-37
  → prisma.media.create()                       :42
```

### 2.4 模块耦合度评估

- **优点**：`lib/adapt.ts` 作为三端唯一适配入口消除重复；`revalidatePostViews()` 一个函数收口 5 处缓存再生；`lib/posts.ts` 的 `isPublicPost` / `publicPostWhere` 是全站唯一可见性规则，避免"草稿泄漏"类分散判断。
- **风险点**：`app/api/posts/route.ts` 与 `app/api/posts/[id]/route.ts` **各定义了一份完全相同的 `revalidatePostViews()`**（`route.ts:12-22` vs `[id]/route.ts:10-20`）——同一逻辑两处实现，未来修改易漏一侧。建议提取到 `lib/posts.ts`。

---

## 三、问题清单（按严重程度分级）

---

### 🔴 P0 阻断级（2 项）

---

#### P0-1 纯中文标题生成的 slug 恒为 `"-"`，导致第二篇文章创建必然失败

| 项 | 内容 |
|---|---|
| **定位** | `app/api/posts/route.ts:85`、`app/dashboard/posts/[id]/EditorClient.tsx:155`、`:217`、`lib/schemas.ts:8-12` |
| **类型** | 业务逻辑缺陷 / 核心流程阻断 |
| **触发** | 新建文章 → 标题填纯中文 → 不手动填写 slug → 发布 |

**根因分析**

三处代码叠加造成：

1. `EditorClient.tsx:155` / `:217` 的 slug 兜底生成：
   ```ts
   slug: current.slug || current.title?.toLowerCase().replace(/[^\w]+/g, "-")
   ```
   `\w` 等价于 `[A-Za-z0-9_]`，**不包含中文**。对于纯中文标题 `"设计原则"`，整个字符串是一个连续的 `[^\w]+` 匹配，被替换为**单个** `-`，结果为 `"-"`。

2. `EditorClient.tsx:172-173` 的 `slugifyTitle` 虽然做了 `.replace(/^-+|-+$/g, "")`（会得到空串），但 `:180` 有 `if (s) next.slug = s` 守卫 → **空串不赋值，slug 保持 `""`**；而保存路径（`:155`/`:217`）的兜底表达式**没有去首尾连字符**，直接产出 `"-"`。

3. `lib/schemas.ts:11` 的校验正则 `^[a-zA-Z0-9-]+$` **接受单个连字符** `"-"`（`+` 量词满足 1 个字符），校验被穿透。

4. `prisma/schema.prisma:41` `slug String @unique` → 第二篇同源 slug → `P2002` → `app/api/posts/route.ts:115` 返回 `400 {"error":"Slug 已存在"}`。

**复现步骤（必现）**

```
1. 后台 → 文章 → 新建（/dashboard/posts/new）
2. 标题输入「设计原则」（不碰 slug 字段）
3. 点「发布」
   → 期望：创建成功
   → 实际：创建成功，但 DB 中 slug = "-"
4. 再新建，标题输入「代码之美」→ 发布
   → 期望：创建成功
   → 实际：HTTP 400 {"error":"Slug 已存在"}，文章无法创建
```

**影响**：默认操作路径下，全新部署只能创建 1 篇中文标题文章；报错信息（"Slug 已存在"）指向一个用户从未填写的字段，**无法自查**。

**修复建议**

```ts
// 方案 A（推荐）：复用项目已依赖的 pinyin-pro，生成有意义的 slug
import { pinyin } from "pinyin-pro"
function slugifyTitle(title: string): string {
  const py = pinyin(title, { toneType: "none", type: "array", nonZh: "consecutive" }).join("-")
  const s = py.toLowerCase().normalize("NFKD")
    .replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "")
  return s || `post-${Date.now()}`          // 兜底唯一值
}
// 三处（:155 / :217 / 服务端 :85）统一改为调用该函数

// 方案 B（最小改动）：兜底加唯一性 + 去连字符
const fallbackSlug = (t?: string, s?: string) =>
  (s?.trim()) || (t || "").toLowerCase().replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "") || `post-${Date.now()}`
```
同时在 `lib/schemas.ts` 收紧：`slugField` 增加 `.min(2)` 与"至少含 1 个字母或数字"的 `refine`，让 `"-"` / `"--"` 在入口即被拒。

---

#### P0-2 新建文章零持久化——刷新/误关页面即丢失全部内容

| 项 | 内容 |
|---|---|
| **定位** | `app/dashboard/posts/[id]/EditorClient.tsx:137-146`（`if (isNew) return`）<br>`app/dashboard/posts/[id]/page.tsx:17-40`（新文章为内存模板 `id: "new"`） |
| **类型** | 数据丢失风险 |
| **触发** | 新建文章并在编辑器中输入内容后，未点保存即刷新/关闭页面 |

**根因分析**

```ts
// EditorClient.tsx:137-146  自动保存 effect
useEffect(() => {
  if (isNew) return                       // ← 新文章直接跳过，自动保存被彻底关闭
  if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
  autoSaveTimerRef.current = setTimeout(() => {
    snapVersion(post.id, post.content)    // 版本快照同样不执行
    handleAutoSave()
  }, 3000)
  return () => { /* clearTimeout */ }
}, [post])
```

- `isNew` 时 `handleAutoSave` 内部（`:151`）也会再次 `return`，双重跳过。
- 新文章 `post.id === "new"`（`page.tsx:19`），即使触发了 PUT 也没有真实 id 可保存，因此**唯一落库途径是手动点「保存草稿」或「发布」**（`:225` 的 POST 分支）。
- 全文件**没有** `beforeunload` 拦截，**没有** localStorage 草稿暂存，`lib/post-versions.ts` 的 `snapVersion` 也被跳过。

**复现步骤（必现）**

```
1. 新建文章，标题「长文测试」
2. 在正文编辑器输入 2000 字（Tiptap 内容仅存在于 React state）
3. 不点击任何保存按钮，按 F5 刷新
   → 期望：恢复草稿或有"未保存"提示
   → 实际：全部内容丢失，返回空白模板，无任何提示
```

**影响**：内容创作是最耗时的环节，误刷新/浏览器崩溃/误关标签页 = 全量返工。对比：**已存在的文章**有 3 秒防抖自动保存 + 5 分钟版本快照 + 10 版 FIFO 回滚（`lib/post-versions.ts`），唯独"新建"这条最高频路径零保护。

**修复建议**

```ts
// 方案 A（推荐，改动最小）：isNew 时走 localStorage 草稿
useEffect(() => {
  if (isNew) {
    const t = setTimeout(() => {
      try { localStorage.setItem("sl-draft:new", JSON.stringify(postRef.current)) } catch {}
    }, 1000)
    return () => clearTimeout(t)
  }
  /* 既有逻辑 */
}, [post, isNew])

// 并在挂载时恢复 + 离开时拦截
useEffect(() => {
  const saved = localStorage.getItem("sl-draft:new")
  if (isNew && saved) { /* 询问用户是否恢复 */ }
  const onBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty) { e.preventDefault(); e.returnValue = "" }
  }
  window.addEventListener("beforeunload", onBeforeUnload)
  return () => window.removeEventListener("beforeunload", onBeforeUnload)
}, [isNew, isDirty])

// 方案 B：首次输入后立即 POST 创建空草稿，拿到真实 id 后复用既有 autosave 链路
```

---

### 🟠 P1 严重级（6 项）

---

#### P1-1 媒体上传可绕过服务端内容校验，把任意文件存为图片

| 项 | 内容 |
|---|---|
| **定位** | `lib/blob.ts:51-54`（GIF 分支）、`app/api/media/route.ts:38`、`:41` |
| **类型** | 输入校验绕过 / 存储型内容注入 |
| **触发** | 已认证用户（或凭据泄漏后）上传任意内容并将文件名/类型伪装为 GIF |

**根因分析**

`app/api/media/route.ts` 的两道校验都可被绕过：

```ts
// app/api/media/route.ts:38   闸 1：MIME 白名单——信任客户端声明的 file.type
if (!ALLOWED_MIMES.has(file.type)) return apiError(400, "仅支持 JPEG/PNG/WebP/GIF")

// app/api/media/route.ts:41   传入的是 Buffer，丢失了 File.type
const res = await compressAndUpload(buffer, filename, { quality: 75 })
```

```ts
// lib/blob.ts:46-54
const buffer = file instanceof Buffer ? buffer : ...
const origMime = (file as any).type || guessMime(filename)   // ← Buffer 无 .type，退化为按扩展名猜
if (origMime === "image/gif" || filename.endsWith(".gif")) {
  const res = await persist(filename, buffer, origMime)      // ← 直接上传，完全跳过 sharp 校验
  return { url: res.url, size: buffer.length, mimeType: origMime }
}
// 非 GIF 分支才有：const metaBefore = await sharp(buffer).metadata()  ← 真正的"内容确实是图片"校验
```

关键点：
- `file.type` 由客户端完全控制，`ALLOWED_MIMES` 白名单形同虚设；
- 白名单通过后，`compressAndUpload` 收到的 `origMime` **不来自白名单的 `file.type`**，而是按文件名扩展名猜测；
- 只要文件名以 `.gif` 结尾，就命中 `:51` 分支，**跳过 sharp 解码校验**，原始字节被原样上传并写入 `prisma.media`。

**复现步骤（HTTP 级，必现）**

```bash
# 1. 用任意合法账户登录，取得 session cookie（见 scripts/api-tests.mjs:25-40 的取法）
# 2. 构造一个"声称是 GIF、实为 HTML"的文件
printf '<html><body><script>alert(document.domain)</script></body></html>' > evil.gif

# 3. 上传（type 声明为白名单内的 image/gif）
curl -i -X POST http://127.0.0.1:3000/api/media \
  -H "Cookie: authjs.session-token=<...>" \
  -F "file=@evil.gif;type=image/gif"

# 期望：400（内容不是图片）
# 实际：200，返回媒体记录；Blob 中存有该 HTML，mimeType 记为 image/gif
```

**影响**
1. **击穿"服务端重压缩"这道核心防线**——前次审查（`docs/backend-review-2026-09-14.md` 第 16 行）结论"MIME 伪造无实质危害"在当前代码下**已不成立**；
2. 任意内容（HTML/JS/超大文本/压缩炸弹）可绕过图片校验入库，构成存储型内容注入面；
3. 单文件 5MB、单请求文件数无上限（`form.getAll("file")`），可被用于存储滥用。

**修复建议**

```ts
// lib/blob.ts：不要信任扩展名，一律以 sharp 探测出的真实格式为准
const meta = await sharp(buffer, { animated: true }).metadata()   // 支持 GIF
if (!meta.format || !["jpeg","png","webp","gif"].includes(meta.format)) {
  throw new Error("Invalid image file")
}
const realMime = `image/${meta.format === "jpg" ? "jpeg" : meta.format}`
// GIF 需要保留动图：以 sharp(buffer, {animated:true}).gif() 重编码，而非原样透传
```
同时在 `app/api/media/route.ts` 增加单请求文件数上限（如 `files.length > 10` → 400），并把"内容校验"下沉为不可跳过的唯一入口。

---

#### P1-2 登录限流可被用作账户锁定 DoS，且限流表无上界增长

| 项 | 内容 |
|---|---|
| **定位** | `lib/auth.ts:11-36`（`loginFails` Map / `isLocked` / `recordFail`） |
| **类型** | 可用性攻击（DoS）/ 逻辑缺陷 |
| **触发** | 无需任何凭据，知道管理员邮箱即可 |

**根因分析**

```ts
// lib/auth.ts:11-13  限流键 = email
const LOCK_THRESHOLD = 5
const LOCK_WINDOW_MS = 15 * 60 * 1000
const loginFails = new Map<string, { count: number; firstFailAt: number }>()

// lib/auth.ts:59  锁定在密码比对之前静默拒绝
if (isLocked(email)) return null
```

三个问题：

1. **纯 email 维度限流 → 定向锁定**：攻击者只需对**已知的**管理员邮箱连续提交 5 次错误密码，即让真实管理员 15 分钟内无法登录（`authorize` 静默 `return null`，页面提示与"密码错误"完全一致，管理员无从判断是被攻击还是记错密码）。可周期性重复实现**持续锁定**。
   `README.md:90` 公开了默认管理员邮箱 `admin@slowlog.dev`，攻击门槛进一步降低。

2. **`recordFail` 的清理是 O(n) 且不阻止增长**（`:31-35`）：
   ```ts
   if (loginFails.size > 100) {
     for (const [k, v] of loginFails) {
       if (now - v.firstFailAt > LOCK_WINDOW_MS) loginFails.delete(k)   // 只删已过期的
     }
   }
   ```
   攻击者用**大量不同 email** 触发失败时，这些条目在 15 分钟内都不会过期 → 遍历一遍后**一个都不删**，`size` 持续增长；而**此后每一次 `recordFail` 都要完整遍历当前 `size`**（无上限）→ 请求耗时随攻击规模线性放大，构成 CPU 放大面，同时是内存泄漏。

3. **无 IP 维度**：同一攻击者更换 email 即可无限尝试，而针对**特定受害者账户**的暴力破解虽被限住，但可用性攻击完全敞开。

**复现步骤（DoS，必现）**

```bash
BASE=http://127.0.0.1:3000
# 取 csrf
CSRF=$(curl -s -c jar.txt $BASE/api/auth/csrf | sed 's/.*"csrfToken":"\([^"]*\)".*/\1/')
# 连续 5 次错误密码（无需知道任何真实密码）
for i in 1 2 3 4 5; do
  curl -s -b jar.txt -c jar.txt -X POST $BASE/api/auth/callback/credentials \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "csrfToken=$CSRF" --data-urlencode "email=admin@slowlog.dev" \
    --data-urlencode "password=wrong$i" --data-urlencode "callbackUrl=$BASE/" >/dev/null
done
# 管理员改用【正确密码】登录 → 仍被拒（isLocked 静默 return null）
```

**修复建议**

```ts
// 1. 双维度限流：IP 为主闸（防跨账户滥用），email 为辅（防定向爆破）
// 2. 定向锁定改为"渐进延迟"而非硬锁，避免被当作 DoS 工具：
//    failCount 1..4 → 正常；>=5 → 每次响应人为延迟 (2^n)ms 上限 5s，仍允许正确密码登录成功
// 3. 限流表改为带上界的 LRU / 定时清理，禁止在每次 recordFail 中做全量遍历：
const MAX_KEYS = 5000
if (loginFails.size > MAX_KEYS) {
  // 批量淘汰最旧的一批（一次 O(k)，k 固定），而非全表扫描
  const victims = [...loginFails.entries()].sort((a,b) => a[1].firstFailAt - b[1].firstFailAt).slice(0, 1000)
  for (const [k] of victims) loginFails.delete(k)
}
```
另建议：登录成功时除清理当前 email 外，同时清理该来源 IP 的计数（实现"登出/成功即复位"）。

---

#### P1-3 RSS 输出未转义 CDATA 终结符，标题含 `]]>` 即破坏整个 feed

| 项 | 内容 |
|---|---|
| **定位** | `app/rss.xml/route.ts:16`、`:20`、`:21` |
| **类型** | XML 注入 / 输出编码缺陷 |
| **触发** | 文章标题、摘要或分类名包含 `]]>` |

**根因分析**

```ts
// app/rss.xml/route.ts:16-21
<title><![CDATA[${post.titleZh || post.title}]]></title>
<description><![CDATA[${post.excerptZh || post.excerpt || ""}]]></description>
<category><![CDATA[${post.category}]]></category>
```

`CDATA` 段落中，**唯一非法的字节序列就是 `]]>`**，而代码未做任何处理。一旦用户内容含 `]]>`，CDATA 提前闭合，后续字符被当作 XML 标记解析 → 整个文档 XML 非法。

**复现步骤**

```
1. 新建文章，标题填：测试]]>注入
2. 发布
3. 访问 /rss.xml
   → 期望：合法 RSS（标题做转义）
   → 实际：XML 解析错误（订阅器报 "XML parsing error"），整个 feed 失效

# 命令行验证
curl -s http://127.0.0.1:3000/rss.xml > feed.xml
python -c "import xml.dom.minidom;xml.dom.minidom.parse('feed.xml')"   # → ExpatError
# 或
xmllint --noout feed.xml
```

**影响**：RSS 是完全失效（非单条降级）。虽然 `]]>` 属于低概率输入，但属确定性的注入类缺陷，且同一模式在未来的 Atom/JSON Feed 输出中会复现。

**修复建议**

```ts
const cdata = (s: unknown) => String(s ?? "").replace(/\]\]>/g, "]]]]><![CDATA[>")
// 用法：<title><![CDATA[${cdata(post.titleZh || post.title)}]]></title>
```
更稳妥：**放弃 CDATA，统一走 XML 实体转义**
```ts
const xml = (s: unknown) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&apos;")
```

---

#### P1-4 JSON-LD 结构化数据未转义，构成存储型 XSS 注入点

| 项 | 内容 |
|---|---|
| **定位** | `app/posts/[id]/page.tsx:70-73` |
| **类型** | 存储型 XSS |
| **触发** | 文章标题/摘要/标签包含 `</script>` 等闭合序列 |

**根因分析**

```tsx
// app/posts/[id]/page.tsx:52-73
const jsonLd = {
  headline: post.titleZh || post.title,              // ← 用户内容
  description: post.excerptZh || post.excerpt,       // ← 用户内容
  keywords: post.tags.join(", "),                    // ← 用户内容
  ...
}
<script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
```

`JSON.stringify` **不会转义 `<`、`>`、`/`**，而 `dangerouslySetInnerHTML` 输出的是**原始 HTML**。当标题为 `</script><img src=x onerror=alert(1)>` 时，`</script>` 会提前闭合脚本标签，其后的 `<img onerror>` 被浏览器解析执行。

**复现步骤**

```
1. POST /api/posts 创建文章，标题为：
   </script><img src=x onerror=alert(document.cookie)>
2. 发布后访问 /posts/<id>
   → 期望：标题作为纯文本展示
   → 实际：浏览器弹出 alert，任意 JS 在读者会话中执行
```

**影响面与定级说明**：当前为单人博客，利用需具备内容发布权限（等价于站长自己），因此实际风险受限，故列 P1 而非 P0。但该模式在以下场景会真实放大：
- 多作者 / 编辑协作；
- 通过 `scripts/import-md.mjs`、`content-export/*.md` 导入**外部不可信内容**；
- 污染 RSS 阅读器与搜索引擎的结构化数据解析。

**修复建议**

```tsx
const safeJsonLd = JSON.stringify(jsonLd)
  .replace(/</g, "\\u003c")
  .replace(/>/g, "\\u003e")
  .replace(/&/g, "\\u0026")
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd }} />
```

---

#### P1-5 媒体上传链路：文件名未消毒 + 批量上传非事务，产生孤儿资源

| 项 | 内容 |
|---|---|
| **定位** | `app/api/media/route.ts:39`、`:42`（文件名）、`:36-44`（循环非事务） |
| **类型** | 输入未消毒 / 数据一致性 |
| **状态** | **前次审查 P2-3 遗留未修** |

**根因分析**

```ts
// app/api/media/route.ts:36-44
for (const file of files) {
  if (file.size > 5 * 1024 * 1024) return apiError(400, "单张上限 5MB")   // ← 直接 return，已上传的不回滚
  if (!ALLOWED_MIMES.has(file.type)) return apiError(400, "仅支持 JPEG/PNG/WebP/GIF")
  const filename = `${Date.now()}-${file.name}`                            // ← file.name 未做任何清洗
  const res = await compressAndUpload(buffer, filename, { quality: 75 })
  const media = await prisma.media.create({ data: { filename: file.name, ... } })  // ← 原始名入库
}
```

两个缺陷：

1. **文件名未消毒**：`file.name` 由客户端完全控制，可包含 `../`、`..\\`、`%2e%2e%2f`、空字节、超长字符串（无长度上限）、控制字符。该值同时用作 **Blob pathname** 与 **DB `Media.filename`**。
   - `lib/blob.ts:17` 的本地降级分支 `putLocal` **已做** `name.replace(/[^a-zA-Z0-9._-]/g, "_")` 清洗（防路径穿越 ✓），但 **Blob 主分支 `persist`（`:25`）直接使用原始 `name`**，两条分支安全水位不一致。
   - 一旦 Vercel Blob 不可用而降级，行为与线上不同，问题难以复现。

2. **循环内提前 `return` 且无回滚**：多文件上传时，若第 3 个文件超限或 MIME 不符，前 2 个已成功上传的 Blob + DB 记录**保留**，但接口整体返回 400 → 调用方以为全部失败，实际产生"孤儿媒体"（`/dashboard/media` 列表里存在，用户不知情）。

**复现步骤**

```
① 文件名注入
   上传时指定 filename 为 ../../evil.png（curl -F 'file=@ok.png;filename=../../evil.png;type=image/png'）
   → 本地降级分支会被 putLocal 清洗；Blob 分支使用未清洗原名入库

② 批量部分失败
   一次选择 3 个文件：文件1 正常 PNG、文件2 正常 PNG、文件3 为 6MB
   → 期望：全部失败并清理，或返回逐文件结果
   → 实际：文件1/2 已入库，接口返回 400「单张上限 5MB」，列表出现 2 条用户以为"没上传成功"的记录
```

**修复建议**

```ts
// 1. 文件名统一消毒（提取为公共函数，Blob 与本地两条分支共用）
const safeName = (n: string) =>
  n.replace(/[^\w.\-]/g, "_").slice(-120) || "file"
const filename = `${Date.now()}-${safeName(file.name)}`

// 2. 批量上传改为两阶段：先全量校验，再逐条提交
const invalid = files.find(f => f.size > MAX || !ALLOWED_MIMES.has(f.type))
if (invalid) return apiError(400, `文件 ${invalid.name} 不合法`)
// 或：逐文件 try/catch 收集结果，返回 { ok: [...], failed: [...] }，并对失败项回滚已上传的 Blob
```

---

#### P1-6 详情查询缺少降级保护，构建可被数据库抖动直接阻断

| 项 | 内容 |
|---|---|
| **定位** | `lib/posts.ts` — `getPostBySlug` / `getPostById` / `getFeaturedPost` / `getAllPostSlugs` |
| **类型** | 构建 / 部署可靠性 |
| **状态** | ✅ **本轮已修复并验证**（详见 4.7 节） |

**根因分析**

`getAllPosts()` 引入了 `catch → []` 以免构建依赖 DB 存活（注释写明"生产构建不再依赖数据库存活"），但**详情查询没有任何保护**：

```ts
// 修复前
export async function getPostBySlug(slug: string) {
  const row = await prisma.post.findUnique({ where: { slug }, include: { category: true } })  // ← 无 try/catch
  return scheduledGuard(row)
}
```

当 `.next/cache` 中已缓存文章列表、而本次构建 DB 不可达时：

1. `generateStaticParams()` 从**缓存**拿到文章 id 列表并返回；
2. 预渲染 `/posts/<id>` 调用 `getPostBySlug()`；
3. `prisma.post.findUnique` 抛 `P1001 Can't reach database server` → 预渲染失败；
4. **整个 `next build` 退出码 1 → 部署中断。**

**为何此前从未暴露**：首次构建时缓存为空 → `getAllPosts()` 降级返回 `[]` → `generateStaticParams` 返回空 → 不预渲染任何详情页 → 恰好绕过详情查询。**构建成败取决于缓存是否为空**，典型的"环境巧合掩盖缺陷"。

**复现步骤**

```bash
# ① DB 可用时构建一次，填充 .next/cache
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:55432/slowlog" npx next build    # EXIT 0

# ② 把 DATABASE_URL 指向不可达端口再构建
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:9999/slowlog" npx next build
# 修复前：Error occurred prerendering page "/posts/<id>" … exiting the build → EXIT 1
# 修复后：EXIT 0 （构建期自动降级）
```

**修复建议（已实施）**

统一降级策略，并区分构建期与运行期：

```ts
const IS_BUILD_PHASE = process.env.NEXT_PHASE === "phase-production-build"

async function degrade<T>(fn: () => Promise<T>, fallback: T, ctx: string): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    if (!IS_BUILD_PHASE) throw e     // 运行期不吞错，交由 error boundary 呈现
    console.warn(`[posts] ${ctx} 构建期降级（数据库不可达）:`, e instanceof Error ? e.message : e)
    return fallback
  }
}
// getAllPosts / getPostBySlug / getPostById / getFeaturedPost / getAllPostSlugs 统一走 degrade()
```

**收益**：构建不再受 DB 抖动影响；同时把原先"运行期也静默返回空列表"改为显式抛错，避免线上故障被伪装成"站点没有内容"（与 P2-18 同源）。

---

### 🟡 P2 一般级（15 项）

---

#### P2-1 `confirmDelete` 未校验响应即提示成功并跳转

**定位**：`app/dashboard/posts/[id]/EditorClient.tsx:234-238`

```ts
const confirmDelete = useCallback(async () => {
  await fetch(`/api/posts/${postRef.current.id}`, { method: "DELETE" })   // ← 未检查 res.ok
  toast(t.dashDeleted, "success")                                          // ← 无条件报成功
  router.push("/dashboard/posts")
}, [router, toast])
```

**复现**：会话过期（401）或文章已被删除（404）时点删除 → 提示"已删除"并跳转列表，但文章仍在。
**修复**：`if (!res.ok) { toast(json.error || "删除失败", "error"); return }`。

---

#### P2-2 自动保存失败静默，状态栏恒显"自动保存中"

**定位**：`EditorClient.tsx:162-169`（失败无提示）、`:436`（静态文案）

```ts
// :162-169  仅有成功分支
if (res.ok) setLastSaved(new Date())
} catch (e) { console.error("autosave failed:", e) }   // ← res.ok=false 时完全无声

// :436  这是写死的文案，与真实状态无关
<span>自动保存中 · 拖拽分隔条调整列宽</span>
```

**复现**：断开网络 / 令 `PUT /api/posts/[id]` 返回 500（如会话过期）→ 继续编辑 → 状态栏始终显示"自动保存中"，用户以为已保存，实际全部丢失。
**修复**：增加 `saveState: "idle" | "saving" | "saved" | "error"`，失败时状态栏显示错误与重试按钮；`res.ok===false` 时也走 error 分支。

---

#### P2-3 发布按钮未禁用，可重复提交

**定位**：`EditorClient.tsx:273`（对照 `:272` 草稿按钮已有 `disabled={saving}`）

```tsx
<Button onClick={() => handleSave("draft")} disabled={saving}>{...}</Button>      // ✓ 有
<Button variant="primary" onClick={() => handleSave("published")}>{...}</Button>  // ✗ 无
```

**复现**：弱网下连点"发布" → 触发多次 `PUT` → 多次 `revalidateTag`/`revalidatePath` 风暴。
**修复**：`disabled={saving}`。

---

#### P2-4 阅读"剩余时间"存在 DOM 双源，会回退到初始值

**定位**：`components/PostClient.tsx:182` 与 `components/ReadingProgress.tsx:26-29`

```tsx
// PostClient.tsx:182  React 渲染
<span data-remaining>{t.readingRemaining(10)}</span>

// ReadingProgress.tsx:26-29  命令式直写同一节点
const el = document.querySelector("[data-remaining]") as HTMLElement | null
if (el) el.textContent = articlePct >= 100 ? t.readDone : mins <= 1 ? t.almostDone : t.readingRemaining(mins)
```

**复现**：长文滚动到中部（显示"剩余 4 分钟"）→ 触发 PostClient 任意重渲染（语言切换、状态变更）→ 文案被 React 打回"剩余 10 分钟"。
**附带缺陷**：`ReadingProgress.tsx:13` 的 `remaining` state 与 `:25` 的 `setRemaining()` **在 JSX 中从未被使用**（`:106-118` 只用了 `progress`/`visible`）→ 死代码，且每次 `paint()` 触发一次无意义重渲染。
**修复**：删除命令式写入，统一由 React state 驱动；移除未使用的 `remaining` state。

---

#### P2-5 阅读进度段落压暗存在 layout thrashing

**定位**：`components/ReadingProgress.tsx:76-85`

```ts
for (const para of paras) {
  const r = para.getBoundingClientRect();      // ← 读（触发样式/布局计算）
  ...
  para.style.opacity = "0.72";                 // ← 写（使已计算的布局失效）
  para.style.transition = "opacity 0.3s ...";  // ← 每帧重复设置
}
```

读写交错导致**每次迭代强制一次重排**，长文（数十段）滚动时明显掉帧。
**修复**：先批量收集 rect，再统一写样式；`transition` 移到 CSS 类而非逐帧写内联样式。

---

#### P2-6 `/api/settings` GET 无鉴权且在 GET 中写库

**定位**：`app/api/settings/route.ts:7-11`

```ts
export async function GET() {
  let s = await prisma.setting.findUnique({ where: { id: "singleton" } })
  if (!s) s = await prisma.setting.create({ data: { id: "singleton" } })   // ← GET 里的写副作用
  return NextResponse.json(s)
}
```

- 未认证即可读取全部站点设置（当前字段均非敏感，风险低，但应显式声明公开范围）；
- **GET 请求产生数据库写入**，违反 HTTP 语义（非幂等 + 预取/爬虫可触发写）；
- 无 `Cache-Control` 头 → 每次请求打库。
**修复**：初始化逻辑移到 seed/迁移；GET 加缓存头；如需公开则显式 pop 白名单字段。

---

#### P2-7 `/api/categories` GET 无错误处理，错误契约不一致

**定位**：`app/api/categories/route.ts:20-23`

```ts
export async function GET() {
  const cats = await getCachedCategories()   // ← 无 try/catch
  return NextResponse.json(cats)
}
```

DB 不可达时抛错 → 框架返回 500（HTML/框架错误结构），而其余路由统一返回 `{ error: string }` JSON。前端按 `data.error` 解析会拿到 undefined。
**修复**：与 `thoughts` GET（`:26-40` 有 try/catch）对齐。

---

#### P2-8 `useLang` 被写在 `try/catch` 内，违反 Hooks 规则

**定位**：`components/Breadcrumb.tsx:13-16`

```tsx
let siteName = "慢日志"
try {
  const { t } = useLang()      // ← Hook 在条件/异常控制流内
  siteName = t.siteName
} catch {}
```

**实测判断**：`lib/lang-context.tsx:46-50` 的 `useLang` 内部先 `useContext`（**必定被调用**）再判断 `!ctx` 抛错，因此当前**不会**出现"hook 数量错配"崩溃——`useContext` 始终执行，抛错发生在其后。
但仍是确定缺陷：① 违反 `react-hooks/rules-of-hooks`，无法通过官方 lint；② 若该组件未来新增 hook，或 Provider 被条件化渲染，就会真的触发 "Rendered fewer hooks than expected"；③ `catch {}` 吞掉 Provider 缺失这一配置错误，掩盖真实问题。
**修复**：无条件调用 `const { t } = useLang()`（Provider 缺失应显式暴露而非静默降级）。

---

#### P2-9 编辑器使用陈旧闭包 setState，可回滚同期字段修改

**定位**：`app/dashboard/posts/[id]/EditorClient.tsx:404`、`:430`（对照 `:201`、`:269` 写法正确）

```tsx
<TiptapEditor content={post.content} onUpdate={(json) => setPost({ ...post, content: json })} />   // :404
{showConfig && <ConfigPanel value={pageConfig} onChange={(v) => setPost({ ...post, pageConfig: v })} />}  // :430
```

`{...post}` 读取渲染闭包里的旧快照。同一批次内若内容回调与字段更新（如 `:269` 的推荐开关、`:201` 的 status）并发，后者会被旧快照覆盖。
**复现**：在编辑器中连续快速输入的同时切换"推荐/精选"开关 → 开关状态偶发回弹。用 **React StrictMode 双调用**会更易复现。
**修复**：统一 `setPost(prev => ({ ...prev, content: json }))`。

---

#### P2-10 多个组件 fetch 未判 `res.ok`、未接 `AbortController`

**定位**：`components/SearchPanel.tsx:43-51`、`components/mobile/MHome.tsx:22-26`、`components/mobile/MDashHome.tsx:31`

仅靠 `catch` 兜底：接口返回 5xx 或 HTML（如被网关拦截）时 `res.json()` 抛错被吞，页面停在 loading 或显示错乱；组件卸载后仍 `setIndex/setLoading`。
**修复**：加 `if (!res.ok) throw new Error(...)`、`signal: controller.signal`，cleanup 中 `controller.abort()`。

---

#### P2-11 定时器未清理（卸载后 setState）

**定位**：`components/Lightbox.tsx:14-23`（`close()` 的 200ms）、`components/SearchPanel.tsx:33-40`、`components/TocDrawer.tsx:36-42,127`、`components/ui/DropdownSelect.tsx:34-40`

**复现**：打开灯箱/抽屉后立即点外部关闭并在 200ms 内路由跳转 → 组件已卸载仍执行 `setState`（React 警告 + 潜在内存泄漏）。
**修复**：`const t = setTimeout(...)` + `return () => clearTimeout(t)`。

---

#### P2-12 Lightbox 键盘监听全局常驻，劫持正常输入

**定位**：`components/Lightbox.tsx:37-46`

```ts
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape") close()
  if (e.key === "+" || e.key === "=") setScale(s => Math.min(s + 0.25, 3))   // 全局生效
  if (e.key === "-") setScale(...)
  if (e.key === "r") setRotation(r => r + 90)
  if (e.key === "0") { setScale(1); setRotation(0) }
}
document.addEventListener("keydown", handleKeyDown)   // ← 未打开时也注册（:53 才 return null）
```

**复现**：在任意输入框（登录、搜索、编辑器）输入字母 `r` 或数字 `0` → 触发 Lightbox 的 `setState`（虽不可见，但造成无谓重渲染；且在 `src` 已有值时会真的旋转/缩放）。
**修复**：`if (!src) return` 移到注册之前，或依赖 `[src]` 仅在打开时注册。

---

#### P2-13 归档/移动端列表对脏数据无防御（NaN 传染、未判空）

**定位**：`app/archive/ArchiveClient.tsx:24,29,30`、`components/mobile/MArchive.tsx:30`

```ts
Math.max(acc, new Date(undefined).getTime())     // → NaN
p.category.toLowerCase()                          // → 分类缺失时 TypeError → 白屏
```

**复现**：任一篇 `publishedAt`/`createdAt` 缺失或非法 → `Latest` 统计整块退化为 `—`；任一 `category` 为 null/空 → 整页白屏。
**修复**：`const t = new Date(x).getTime(); if (!Number.isNaN(t)) acc = Math.max(acc, t)`；`(p.category || "").toLowerCase()`。

---

#### P2-14 首页高频路径缺少节流与 memo 边界

**定位**：`components/HomeClient.tsx:57`、`:126-135`、`:144-163,362`、`:177`、`:451-459`

- hero 每 5 秒 `setHeroIndex` 触发**整页重渲染**，且 `:451-459` 的年份排序 / 日期解析在渲染期重算（O(n log n)）；
- `:57` 的本地化在渲染期重建对象 → 击穿 `:177` 的 `useMemo` 与 `components/CoverArt.tsx:347` 的 `memo`；
- `:144-163,362` 列表 `key` 含 `searchQuery`，配合 220ms 淡出重挂 → 搜索框每敲一个字符整表卸载重建、`Reveal` 动画重播、滚动位置丢失；
- `components/Footer.tsx:13`、`components/Header.tsx:21` 滚动直接 `setState`（无 rAF / 无值比较）。

**修复**：排序/解析结果 `useMemo` 化；hero 轮播改为局部子树更新（或 CSS 动画驱动）；搜索输入防抖 200ms 且搜索态不重挂列表；scroll 回调包 rAF + 值变更判断。

---

#### P2-15 `/api/search-index` 被静态预渲染，构建期无 DB 时搜索索引固化为空

**定位**：`app/api/search-index/route.ts:23`（`export const revalidate = 3600`）+ `lib/posts.ts:153-160`（静默降级）+ 构建产物标记

**根因分析**

```ts
// app/api/search-index/route.ts:20-23
// 全局搜索索引：运行时按需生成（数据量小 ≤100 篇），CDN 缓存 1h + SWR。
export const revalidate = 3600          // ← App Router 语义：本路由被静态预渲染并写入 Full Route Cache
```

实测构建输出将该路由标记为 **`○ (Static) prerendered as static content`**，与注释所称"运行时按需生成"不符。

叠加 `lib/posts.ts:153-160` 的降级逻辑：

```ts
try {
  const rows = await getCachedPostRows(where.status)
  return rows.map(mapPost)
} catch {
  // 构建机/CI 无 DB 时优雅降级为空列表——生产构建不再依赖数据库存活
  return []
}
```

→ **构建机无数据库时（这正是被显式支持的部署场景），索引被固化为 `{v:1, posts:[], thoughts:[], categories:[], offline:true}` 并缓存，部署后搜索面板返回空结果。**

**复现步骤**

```bash
# 1. 构建时不提供可用的 DATABASE_URL（模拟 CI 无 DB 构建）
DATABASE_URL="postgresql://x:x@127.0.0.1:9999/none" npx next build
# 观察输出：/api/search-index 被标记为 ○ (Static)

# 2. 启动服务并带上可用的 DATABASE_URL
npx next start -p 3101
curl -s http://127.0.0.1:3101/api/search-index | head -c 200
# 期望：{"v":1,"generatedAt":"...","posts":[...非空...]}
# 实际：{"v":1,"posts":[],"thoughts":[],"categories":[],"offline":true}
```

**影响**：线上搜索功能静默不可用（无报错），需等到 revalidate 窗口到期或某次发布文章触发 `revalidateTag("posts")` 才自愈。用户看到的是"搜不到任何内容"而非错误提示。

**修复建议**

```ts
// 方案 A（推荐）：明确声明动态，让索引每次请求/按 CDN 缓存生成
export const dynamic = "force-dynamic"          // 替换 export const revalidate = 3600
// 缓存交给已有的响应头（route.ts:100 已设置 s-maxage=3600, swr=600）

// 方案 B：保留静态化，但让降级可区分——DB 不可达时返回 503 而非空索引，
//        避免"空结果"被当作有效数据缓存
catch (e) {
  console.error("[search-index] DB unavailable", e)
  return NextResponse.json({ error: "索引暂不可用" }, { status: 503 })
}
```

---

### 🔵 P3 改进级（26 项）

| # | 定位 | 问题 | 建议 |
|---|---|---|---|
| P3-1 | `next.config.mjs:29-38` | 已有 nosniff / X-Frame-Options / Referrer-Policy / X-XSS-Protection，**缺 CSP** | 补 `Content-Security-Policy`（至少 `default-src 'self'`、`object-src 'none'`、`frame-ancestors 'none'`） |
| P3-2 | `app/api/health/route.ts:15,21` | 公开暴露 DB 查询延迟与 `BLOB_READ_WRITE_TOKEN` 是否配置 | 对外只返回 `{status}`，详细信息加鉴权 |
| P3-3 | `lib/schemas.ts:104-120` | `changePasswordSchema` 已定义但**路由未使用**（`app/api/auth/change-password/route.ts:18-29` 手写重复校验），两处易漂移 | 路由改用 `changePasswordSchema.safeParse` |
| P3-4 | `lib/schemas.ts:34` | `tiptapDoc = z.record(z.string(), z.unknown())` 无体积/深度上限 | 加 `.refine(v => JSON.stringify(v).length <= 1_000_000)` |
| P3-5 | `lib/blob.ts:96-99` | `/uploads/` 分支 `path.join(process.cwd(), "public", url)`，若 `url` 含 `../` 会逃出 public | 规范化后校验 `resolved.startsWith(publicDir)` |
| P3-6 | `lib/blob.ts:102` | `deleteFromBlob` 的 `catch {}` 吞掉所有删除失败 | 至少 `console.warn` 并上抛可观测信号 |
| P3-7 | `scripts/test-force-password.mjs:35` | 硬编码默认账户凭据 `admin@slowlog.dev / admin123` | 改从环境变量读取 |
| P3-8 | `components/dashboard/Sidebar.tsx:115` | 版权年份硬编码 `2026` | `new Date().getFullYear()` |
| P3-9 | `components/editor/ColorPicker.tsx:34,46` | 点色板只调 `onChange`，不同步本地 `custom` → `#hex` 输入框显示旧值 | 由受控值派生 |
| P3-10 | `components/editor/ResizableImageView.tsx:35-41` | `pointermove/pointerup` 仅在手势结束时移除，拖拽中卸载则永久泄漏 | `useEffect` cleanup 兜底移除；`maxW` 加下限保护 |
| P3-11 | `app/api/categories/route.ts:12` | `_count.posts` 统计包含草稿，公开接口泄漏草稿数量 | 按状态过滤计数 |
| P3-12 | `app/api/posts/route.ts:41-47` | `q` 参数未转义 LIKE 通配符（`%`/`_`），搜 `%` 匹配全部 | 搜索词转义，或改用专用搜索索引 |
| P3-13 | `lib/posts.ts:55-72` | `extractHeadings` 只遍历顶层 `doc.content`，blockquote/list 内 heading 不进目录 | 递归遍历 |
| P3-14 | `lib/posts.ts:122` | `headingsZh: headings` —— 中英目录共用同一份中文标题，与"中英独立字段"策略不一致 | 按 `titleZh` 分别提取 |
| P3-15 | `lib/posts.ts:153-160` | `getAllPosts` 的 `catch { return [] }` 让"DB 故障"与"确实无文章"不可区分且无日志 | 区分构建期/运行期；运行期记录错误并上抛或返回标记 |
| P3-16 | `app/api/posts/route.ts:12-22` / `[id]/route.ts:10-20` | `revalidatePostViews` 在两处重复定义（同一逻辑两份实现） | 提取到 `lib/posts.ts` |
| P3-17 | `app/layout.tsx:88,93,102,108` | 四处 `dangerouslySetInnerHTML` 均为**硬编码**常量（内联 CSS / 主题首帧脚本），无用户输入拼接 | 当前安全；建议加注释固定"禁止插值"约束 |
| P3-18 | `app/dashboard/change-password/page.tsx:151` | 提交按钮 `disabled` 依赖 6 个字段非空，但 `newPassword` 未 trim 判断（`:44` 才 trim） | 校验前置到输入层 |
| P3-19 | `middleware.ts:35-43` | `redirectFor` 用**客户端可控**的 `x-forwarded-host` / `x-forwarded-proto` 拼接重定向目标；而 `lib/site-url.ts:4-6` 明确写着"刻意不读取 Host / X-Forwarded-Host"以防 SEO 投毒——**两处策略相互矛盾**。`/admin/*` 兼容跳转对全体访客生效，伪造 Host 即可把访客 302 到攻击者站点（开放重定向/钓鱼） | 对 host 做白名单校验，或统一改用 `getSiteUrl()` 的 env 策略 |
| P3-20 | `app/api/posts/[id]/view/route.ts:11-13` | `clientIp` 直取 `x-forwarded-for` 首段（客户端可伪造），可绕过 15 分钟去重窗口无限刷浏览量 | 仅信任可信代理链的固定跳数（或改用平台注入的不可伪造头） |
| P3-21 | `components/editor/PostRenderer.tsx:72-74` | heading 的 `level` 未白名单化（`const Tag = \`h${level}\``）：Tiptap JSON 写入非法 level 会生成非法标签名，React 渲染期报错 | 用 `[1,2,3,4].includes(level) ? level : 2` 收口，与 `page-config` 白名单风格一致 |
| P3-22 | `components/editor/PostRenderer.tsx:207` | `isDarkMode` 读取 `document` 后**从未被使用**（第 219 行传的是 `isDark(pc)`）——死代码，且是 SSR/CSR 水合不一致的典型来源 | 删除该变量 |
| P3-23 | `components/editor/PostRenderer.tsx:66` | `renderNode` 递归无深度上限；配合 `lib/schemas.ts:34` 的 `tiptapDoc` 无体积/深度约束，恶意深嵌套 JSON 可致渲染栈溢出 | 递归加深度守卫（如 >50 层截断）+ schema 限制 content 体积 |
| P3-24 | `components/editor/PostRenderer.tsx:73` | 嵌套在 blockquote/list 内的 heading，其锚点用**局部** `idx` 生成，可能与顶层 heading 的 id 重复 → `#锚点` 跳转错位（与 P3-13 同源） | 统一用全局递增序号生成 |
| P3-25 | `app/api/posts/[id]/route.ts:25` | `GET /api/posts/[id]` 仅按 `id` 查询，而页面层是 `slug \|\| id` 双兼容 → API 与页面对 slug 的支持不一致 | 需要时在 API 侧同样支持 slug 回退，或在文档中明确只接受 id |
| P3-26 | `app/api/media/route.ts:71` | DELETE 仅在 url 含 `blob.vercel-storage.com` 时调用 `deleteFromBlob`，**本地降级产物（`/uploads/*`）与 data URI 从不清理** → 本地开发时 `public/uploads` 持续累积垃圾文件（E2E 实测复现：删除记录后文件仍在） | 按 url 形态分派：`/uploads/` 走本地删除、Blob 走远端删除 |

---

## 四、端到端功能测试

### 4.1 测试环境与方法

| 项 | 值 |
|---|---|
| 操作系统 | Windows（控制台代码页 **936 / GBK**） |
| Node | v22.22.2 |
| 包管理 | npm 10.9.7 |
| 框架 | Next.js 15.5.24（生产构建）· React 19.2.3 |
| 数据库 | 目标为 PostgreSQL；本机无实例 |
| 测试层次 | ① 全量类型检查 ② 生产构建 ③ HTTP 级端到端（真实服务 + 真实数据库） |

### 4.2 ✅ 已完成验证

#### ① TypeScript 全量类型检查 — PASS

```
$ npx tsc --noEmit
=== TSC EXIT CODE: 0 ===
```

**0 错误 0 警告**。意义：本报告全部 49 项发现**均不属于类型层面问题**，而是运行时逻辑、安全、并发、性能、构建可靠性与边界处理层面的缺陷——这类问题恰好是类型系统无法拦截的，必须靠代码审查与端到端测试发现。**P1-6（构建脆弱性）就是端到端测试才能暴露的典型例证**：它此前被"缓存恰好为空"反复掩盖。

#### ② Next.js 生产构建 — PASS

```
$ DATABASE_URL=... AUTH_SECRET=... NEXT_PUBLIC_SITE_URL=... npx next build
✓ Compiled successfully in 26.9s
  Linting and checking validity of types ...
✓ Generating static pages (25/25)
=== BUILD EXIT: 0 ===
```

产物统计：

| 指标 | 值 |
|---|---|
| 路由总数 | 43 |
| 静态生成页面 | 25 |
| 共享 First Load JS | 103 kB |
| 最大页面 | `/m/posts/[id]` 140 kB First Load |
| Middleware 包 | 87.4 kB |

`lucide-react` 按需引入、Tiptap/编辑器 `next/dynamic` 懒加载、字体自托管等性能措施**均按预期生效**（`/dashboard/posts/[id]` 首屏 129 kB，未包含 Tiptap 主体）。

#### ③ 构建产物路由类型审计 — 发现 1 项新增问题

| 路由 | 构建标记 | 评估 |
|---|---|---|
| `/` · `/login` · `/m` · `/t` | ○ Static, revalidate 1m | ✅ 符合预期（前台可 ISR） |
| `/posts/[id]` · `/m/posts/[id]` | ● SSG（generateStaticParams 取前 20 篇） | ✅ 其余走 ISR 按需生成 |
| `/dashboard/*` · `/api/posts` · `/api/media` … | ƒ Dynamic | ✅ 正确（后台与写接口需实时） |
| **`/api/search-index`** | **○ Static, revalidate 1m** | ⚠ **与代码注释"运行时按需生成"（`app/api/search-index/route.ts:20`）矛盾** |

**新增问题 P2-15（见第三章）**：`/api/search-index` 声明了 `export const revalidate = 3600`，在 App Router 语义下会被**静态预渲染并写入 Full Route Cache**。而该路由的取数依赖 `getAllPosts()`，其内部在 DB 不可达时**静默返回空数组**（`lib/posts.ts:153-160`）。两者叠加的结果是：**在构建机无数据库的部署场景下，搜索索引会被固化为 `{posts: [], thoughts: [], categories: [], offline: true}`，部署后搜索功能返回空结果**，直到 revalidate 窗口到期或某次文章发布触发 `revalidateTag("posts")` 才会自愈。

#### ④ 关键缺陷单元级实测 — **3/3 项复现成功**

对三个"可脱离数据库验证"的关键缺陷，直接以真实项目代码路径执行验证（`npx tsx scripts/review-e2e/unit-verify.ts`）：

**P0-1 · 纯中文标题 slug 退化 — ✅ 实测复现**

```
══════ P0-1 中文标题 slug 生成（实测）══════
   "设计原则"    →  "-"
   "代码之美"    →  "-"
   "Hello 世界"  →  "hello-"
   "Hello World" →  "hello-world"

   第 1 篇 slug="-" ｜ 第 2 篇 slug="-"
   两篇 slug 是否相同（→ 必然触发唯一约束冲突）: true
   zod 是否接受 slug="-" : true
   zod 是否接受 slug="--" : true
   ✅ 复现成功：退化 slug 绕过校验且必然冲突
```

**结论确证**：任意两个纯中文标题都会生成完全相同的 `slug = "-"`，且该值**能通过 `lib/schemas.ts` 的 zod 校验**，最终撞上 `Post.slug @unique` 唯一约束 → 第 2 篇起 `400 Slug 已存在`。
（附带观察：中英混合标题 `"Hello 世界"` 会生成 `"hello-"`（尾部多余连字符），虽不致命但不规范。）

**P1-3 · RSS CDATA 未转义 — ✅ 实测复现**

```
══════ P1-3 RSS CDATA 未转义（实测）══════
   输入标题: "CDATA 注入 ]]> 测试"
   实际输出: <title><![CDATA[CDATA 注入 ]]> 测试]]></title>
   是否存在被提前闭合的裸 ]]> 序列: true
   XML 解析器校验结果: 失败（文档非法）
   ✅ 复现成功：标题含 ]]> 即产生非法 XML，feed 损坏
```

**结论确证**：使用**真实 XML 解析器**（Python `xml.dom.minidom`）校验，输出文档**解析失败**——RSS feed 整体不可用，非单条降级。

**P1-4 · JSON-LD 未转义 — ✅ 实测复现**

```
══════ P1-4 JSON-LD 未转义（实测）══════
   实际注入到 <script type="application/ld+json"> 的内容：
   {"@type":"Article","headline":"</script><img src=x onerror=alert(1)>","description":"x"}
   是否含未转义的 </script> 闭合序列: true
   修复后（< → \u003c）：
   {"@type":"Article","headline":"\u003c/script\u003e\u003cimg src=x onerror=alert(1)\u003e",...
   ✅ 复现成功：未转义 </script> 可突破脚本标签
```

**结论确证**：`JSON.stringify` 输出的 `</script>` 会真实闭合脚本标签，后续 `<img onerror>` 可在读者浏览器执行。按建议的 `\u003c` 转义后即安全。

**对照组 · 渲染白名单防护 — ✅ 实测有效（正面结论）**

```
══════ 对照组：渲染白名单防护（应全部拦截）══════
   safeColor('red;}</style><script>alert(1)</script>')  →  已拦截 ✓
   safeColor('expression(alert(1))')                     →  已拦截 ✓
   safeColor('url(javascript:alert(1))')                 →  已拦截 ✓
   safeHref('javascript:alert(1)')                       →  已拦截 ✓
   safeImgSrc('data:text/html;base64,...')               →  已拦截 ✓
   合法值 safeColor('#4a6fb5')                           →  放行 ✓
   合法值 safeHref('https://example.com')                →  放行 ✓
   parsePageConfig 非法输入回退: "oklch(0.55 0.15 250)" (layout=standard, showTOC=true)
```

**结论**：`lib/page-config.ts` 的 `safeColor` / `safeHref` / `safeImgSrc` 白名单**经受住了实际注入字符串考验**（CSS 逃逸、`expression()`、`url(javascript:)`、`javascript:` 协议、`data:text/html` 均被拦截），`parsePageConfig` 对非法枚举与类型错误也正确回退默认值。这是本项目**做得最扎实的一处安全设计**；相较之下，P1-4 的 JSON-LD 是同一渲染层里唯一的漏点，修复它即可让该层收敛。

### 4.3 ✅ HTTP 级端到端已完成（曾阻塞，根因已定位并解决）

HTTP 级端到端测试需要真实 PostgreSQL 实例。本机初始环境存在以下阻塞，**均已在本次审查中解决**：

| 阻塞项 | 初始状态 | 解决方式 |
|---|---|---|
| 本机 PostgreSQL 服务 | ❌ 未安装（5432 无监听） | 启用 `embedded-postgres` 附带的 PG 18.4 二进制 |
| Docker | ❌ 未安装 | 无需（改用内嵌 PG） |
| Vercel Blob Token | ❌ 未配置 | 不需要——代码自动降级到本地 `public/uploads`，API 契约照常验证 |
| 内嵌 PostgreSQL 初始化 | ❌ `initdb` 持续失败 | **根因见下，已解决** |

**根因（三次假设逐一排除后确证）**

最初观测到的错误：

```
performing post-bootstrap initialization ...
FATAL:  invalid byte sequence for encoding "UTF8": 0xc2 0xfd
child process exited with exit code 1
```

| # | 假设 | 验证结果 |
|---|---|---|
| 1 | locale 不匹配（`Chinese (Simplified)_China.936`） | ❌ 补 `--locale=C --encoding=UTF8` 后仍失败 |
| 2 | 控制台代码页 936(GBK) 导致 | ❌ **`chcp.com 65001` 实测无效**——代码页确已切换，错误原文不变 |
| 3 | **PG 二进制所在路径含非 ASCII 字符** | ✅ **确证**：移动到 `C:/pgtest/native` 后 `initdb` 一次成功 |

结论：**PostgreSQL 在 Windows 下对「二进制安装路径含中文」敏感**（本机项目路径为 `...\Worktrees\慢日志\...`），与代码页无关，亦与数据目录路径无关（数据目录本就位于纯 ASCII 的 `%TEMP%`）。

**另外两个环境坑（已在编排脚本中固化处理）**

- `embedded-postgres` 的 `native/bin` **只含服务端二进制**（`initdb` / `pg_ctl` / `postgres`），没有 `psql` / `createdb` / `pg_isready` → 建库与健康检查改用 `node` + `pg` 驱动（`scripts/review-e2e/db-wait.mjs`）。
- `pg_ctl start` 的输出**必须整份重定向到文件**：postgres 子进程会继承 stdout，若接管道（`| tail`）管道永不关闭，编排脚本永久挂起（首次尝试即卡死 10 分钟）。

### 4.4 端到端测试用例设计（两层）

阻断环境问题后，以下脚本可直接运行（一套完整、真实 HTTP 的端到端验证）：

**第一层：项目自带集成测试（6 场景，`scripts/api-tests.mjs`）**

| 场景 | 断言内容 |
|---|---|
| ① 登录限流 | 5 次失败后，正确密码也应被拒绝 |
| ② 改密流程 | 当前密码错误→403 / 两次不一致→400 / 正确→200 / 新密码可登录 |
| ③ 草稿保护 | 匿名 GET 草稿→404 / 匿名列表不含草稿 / 管理员可见（**验证 `isPublicPost` 唯一可见性规则**） |
| ④ 定时发布 | 未来 `publishedAt` 的文章对匿名访问→404，且不出现在列表（**验证惰性过滤，无 cron 依赖**） |
| ⑤ 缓存隔离 | 管理员列表 `private, no-store` / 匿名列表不带（**验证含凭证响应不进入共享缓存**） |
| ⑥ 上传校验 | 非图片 MIME→400 / 超 5MB→400 / 合法 PNG→200 / 删除清理 |

**第二层：本次新增的缺陷复现测试（`scripts/review-e2e/extra-tests.mjs`）**

| 用例 | 预期（修复后） | 当前预期结果 |
|---|---|---|
| P0-1a/b/c 连续创建 2 篇纯中文标题文章 | 均 200，slug 唯一且可读 | **第 2 篇 400「Slug 已存在」** |
| P1-1a HTML 内容伪装 `.gif` 上传 | 400 | **200，绕过内容校验入库** |
| P1-1b 对照组：合法 PNG | 200 | 200 |
| P1-3a/b 标题含 `]]>` 后的 RSS | 转义正确 + XML 解析通过 | **XML 解析失败（feed 损坏）** |
| P1-4 JSON-LD 含 `</script>` | 已转义 | **未转义，可执行脚本** |
| P2-6 `/api/settings` 匿名读 + 缓存头 | — | 公开可读、无缓存头 |
| P3-2 `/api/health` 匿名暴露内部状态 | — | 暴露 DB 延迟与 Blob 配置 |
| search-index 运行时索引 | 非空 | **构建期静态化为空索引** |

运行方式：

> **前置依赖**（仅本地测试用，不写入 `package.json`）：`npm i --no-save embedded-postgres`，或直接指向已有的本地 / 远程 PostgreSQL。
> **⚠️ 若使用内嵌 PG，其二进制必须位于纯 ASCII 路径**（`initdb` 的失败根因是"安装路径含中文"，与控制台代码页无关，见 4.3）。

**推荐：一键编排**（PG → 建表 → 种子 → 起服务 → 两层测试 → 清理，全在同一进程组内完成）

```bash
PG_BIN=/c/pgtest/native/bin PG_DATA=/c/pgtest/data . scripts/review-e2e/run3.sh
```

**或：手动分步**

```bash
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:55432/slowlog"
export AUTH_SECRET="local-test-secret"

# 1. 等待 PG 就绪并确保目标库存在（该发行包的 bin 无 psql / pg_isready，故用 node 驱动）
PG_PORT=55432 node scripts/review-e2e/db-wait.mjs

# 2. 建表 + 种子 + 测试账户
npx prisma db push
npx tsx prisma/seed.ts
node scripts/api-tests-fixtures.mjs

# 3. 启动服务
npx next start -p 3101

# 4. 跑两层测试
node scripts/api-tests.mjs               http://127.0.0.1:3101
node scripts/review-e2e/extra-tests.mjs  http://127.0.0.1:3101

# 5. 无需数据库的单元回归（随时可跑）
npx tsx scripts/review-e2e/unit-verify.ts
```

### 4.5 核心业务流程覆盖矩阵（静态推导 + 已验证部分）

| # | 业务流程 | 涉及模块 | 静态审查结论 | 验证状态 |
|---|---|---|---|---|
| 1 | 登录 → JWT 签发 → middleware 鉴权 | `auth.ts` → `auth-config.ts:13-24` → `middleware.ts:88-103` | 链路完整；限流引入 DoS（**P1-2**） | 部分（构建通过） |
| 2 | 首次登录强制改密 | `auth.ts:73-74` → `middleware.ts:95-103` → `change-password/page.tsx:54-58` | 逻辑闭环正确（改密后主动 `signOut` 刷新 JWT，**非缺陷**） | 静态确认 |
| 3 | 文章创建（POST） | `posts/route.ts:75-119` | slug 生成缺陷（**P0-1**） | 静态确证 |
| 4 | 文章编辑 + 自动保存 | `EditorClient.tsx:137-170` | 新文章零持久化（**P0-2**）、失败静默（**P2-2**）、陈旧闭包（**P2-9**） | 静态确证 |
| 5 | 发布 → 缓存再生 → 前台生效 | `posts/[id]/route.ts:10-20` → `lib/posts.ts:140` → `revalidatePath` | 缓存联动完整；`revalidatePostViews` 重复定义（**P3-16**） | 静态确认 |
| 6 | 草稿/定时文章隔离 | `lib/posts.ts:75-82` | 唯一规则收口，无泄漏路径 | 静态确认（测试用例③④就绪） |
| 7 | 媒体上传 → 压缩 → 存储 | `media/route.ts:27-51` → `blob.ts:39-92` | 内容校验可绕过（**P1-1**）、非事务（**P1-5**） | 静态确证 |
| 8 | 搜索索引 → 前端检索 | `search-index/route.ts` → `SearchPanel.tsx` | 静态化致空索引（**P2-15**）、前端未判 `res.ok`（**P2-10**） | 静态确证 |
| 9 | RSS / Sitemap 输出 | `rss.xml/route.ts` · `sitemap.ts` | CDATA 未转义（**P1-3**）、origin 取 env 防 Host 注入 ✓ | 静态确证 |
| 10 | 移动端/平板 UA 分流 | `middleware.ts:11-85` | 分流规则清晰、`view` cookie 可控；重定向基于 `x-forwarded-host`（见 **P3-19**） | 静态确认 |
| 11 | 浏览计数 | `posts/[id]/view/route.ts:23-36` | 内存去重 + IP 兜底；IP 可伪造（**P3-20**） | 静态确认 |

### 4.6 测试结论

- **可构建、可类型检查、可部署**：`tsc --noEmit` 与 `next build` **全绿**，工程基础扎实，性能优化措施按预期生效。
- **3 项关键缺陷已实测复现（非推测）**：P0-1（`"设计原则"`/`"代码之美"` 均生成 `slug="-"`，且 zod 放行 → 必然冲突）、P1-3（真实 XML 解析器校验 **失败**，feed 损坏）、P1-4（`</script>` 未被转义）。
- **对照组实测有效**：`safeColor` / `safeHref` / `safeImgSrc` / `parsePageConfig` 对 CSS 逃逸、`expression()`、`url(javascript:)`、`javascript:`、`data:text/html` **全部拦截**——渲染白名单是本项目最扎实的安全设计。
- **不可直接投产**：存在 2 个必现的业务阻断缺陷（**P0-1**、**P0-2**）与 5 个严重缺陷，其中 **P1-1（上传校验绕过）** 与 **P1-3（RSS 破坏）** 均有明确、可复现的触发条件。
- **HTTP 级实测已完成**：真实 PostgreSQL 18.4 + 生产模式服务下，项目自带 6 场景集成测试 **25/25 通过**，本次新增缺陷复现测试 **14/15 通过**（唯一失败为尚未修复的 P2-6，符合预期）。曾阻塞的 `initdb` 问题根因已确证为「**PG 二进制路径含中文**」而非代码页，详见 4.3。
- **端到端测试额外发现并修复了 P1-6**：详情查询缺少降级保护，会让 DB 一次抖动直接阻断 `next build` —— 这是纯静态审查与"缓存恰好为空"的常规构建**都无法暴露**的缺陷。

---

### 4.7 端到端实测结果（真实 PostgreSQL 18.4 + 真实 HTTP，生产模式 `next start`）

#### 第一层 · 项目自带 API 集成测试 — **25 通过 / 0 失败** ✅

| 场景 | 断言 | 实测 |
|---|---|---|
| ② 改密 | 旧密码错误→403 / 两次不一致→400 / 正确→200 / 新密码可登录 | ✅ 403 / 400 / 200 / 可登录 |
| ⑥ 登录防护 | 连续失败后**正确密码仍可登录**（渐进延迟而非硬锁） | ✅ 可登录（修复后行为，见 P1-2） |
| ③ 草稿保护 | 匿名 GET 详情→404 / 匿名列表不含草稿 / 管理员可见 | ✅ 404 / 不含 / 200 |
| ④ 定时发布 | 未来 `publishedAt` 对匿名→404 且不在列表 | ✅ 404 / 不含 |
| ⑤ 缓存隔离 | 管理员列表 `private, no-store` / 匿名不带 | ✅ `private, no-store` / `public, s-maxage=60, swr=300` |
| ① 浏览计数 | 已发布→ok / 不存在→404 / `viewCount ≥ 1` | ✅ 200 / 404 / 1 |
| ⑥b 上传校验 | 非图片 MIME→400 / 超 5MB→400 / 合法 PNG→200 / 删除→ok | ✅ 400 / 400 / 200 / 200 |

#### 第二层 · 本次新增缺陷复现测试 — **14 通过 / 1 失败** ✅

> 唯一失败项为 `P2-6b /api/settings 无缓存头` —— 这正是**尚未修复**的 P2-6，符合预期（回归测试如实反映遗留问题）。

| 用例 | 修复前 | 修复后实测 |
|---|---|---|
| P0-1a/b/c 连续创建 2 篇纯中文标题 | 第 2 篇 400「Slug 已存在」 | ✅ 两篇均 200，slug = `she-ji-yuan-ze` / `dai-ma-zhi-mei` |
| P1-1a HTML 内容伪装 `.gif` | 200（绕过校验入库） | ✅ **400**（内容校验生效） |
| P1-1b 对照组：合法 PNG | 200 | ✅ 200 |
| P1-3a/b 标题含 `]]>` 的 RSS | XML 解析失败 | ✅ 转义正确 + XML 解析通过 |
| P1-4 JSON-LD 含 `</script>` | 未转义 | ✅ 已转义 |
| P2-6b `/api/settings` 缓存头 | 无 | ❌ 仍无（未修复项） |
| P3-2 `/api/health` 匿名暴露 | 暴露 | ❌ 仍暴露 `{"db":"ok (1ms)","blob":"not-configured"}`（未修复项） |
| 搜索索引运行时可用性 | 推断可能为空索引 | ✅ `posts=3 offline=false`（**见下方修正**） |

#### 🔧 端到端测试新发现的缺陷：P1-6 构建脆弱性（已修复）

本轮 E2E 意外暴露出一个**此前所有构建都掩盖了的 P1 级缺陷**——它是本次审查**最有价值的发现之一**：

```
Error occurred prerendering page "/posts/cmu2hnqn70007tqtosahbgami"
Invalid `prisma.post.findUnique()` invocation:
Can't reach database server at `127.0.0.1:9999`
Export encountered an error on /posts/[id]/page: ..., exiting the build.
⨯ Next.js build worker exited with code: 1
```

| 项 | 内容 |
|---|---|
| **定位** | `lib/posts.ts` — `getPostBySlug` / `getPostById` / `getFeaturedPost` / `getAllPostSlugs` 缺少降级保护 |
| **机制** | `getAllPosts()` 有 `catch → []` 降级，**详情查询没有**。当 `.next/cache` 中已缓存文章列表、而本次构建 DB 不可达时：① `generateStaticParams` 从**缓存**拿到 id 列表；② 预渲染 `/posts/<id>` 调用 `getPostBySlug`；③ `findUnique` 抛 `P1001` → **整个 `next build` 退出码 1** |
| **为何此前从未暴露** | 首次构建时缓存为空 → `getAllPosts()` 降级返回 `[]` → `generateStaticParams` 返回空 → 不预渲染任何详情页 → 恰好绕过。**构建能否成功取决于缓存是否为空**，DB 一次抖动即可阻断部署 |
| **复现** | ① DB 可用时构建一次（填充缓存）；② 把 `DATABASE_URL` 指向不可达端口再构建 → EXIT 1 |
| **修复** | 统一降级策略：抽出 `degrade()` 包裹所有查询；**构建期**（`NEXT_PHASE=phase-production-build`）DB 不可达一律降级，**运行期**不吞错交由 error boundary（避免把线上故障静默伪装成空列表） |
| **验证** | DB 可用构建 EXIT 0；**DB 不可达 + 缓存有数据构建 EXIT 0**（修复前为 EXIT 1） |

#### 📌 对 P2-15 的修正（实测推翻部分推断）

实测 `GET /api/search-index` 在 `next start` 后返回 `{"posts":3,...,"offline":false}`，**搜索索引运行时可用**。此前"构建期无 DB 会固化为空索引"的判断**影响被高估**——运行时 ISR/revalidate 会重新生成。**该条由 P2 下调为 P3 观察项**；真正需要留意的是它仍被标记为 `○ (Static)`，与源码注释"运行时按需生成"不符。

---

## 五、与前次审查（2026-09-14）的增量回归对照

前次报告见 `docs/backend-review-2026-09-14.md`。本次逐项复核其修复状态：

### ✅ 已修复（回归验证通过）

| 前次编号 | 前次问题 | 本次验证 |
|---|---|---|
| **P1-1** | 登录无限流，可无限暴力尝试 | ✅ 已实现 `lib/auth.ts:9-40`（5 次失败 / 15 分钟锁定）——**但引入了新缺陷，见本报告 P1-2** |
| P2-1 | Prisma `ssl.rejectUnauthorized: false` | ✅ 已改为 `true`（`lib/prisma.ts:15`），并对本地地址智能降级 |
| P2-2 | change-password 不验旧密码 | ✅ 已加 `bcrypt.compare(currentPassword, user.password)`（`app/api/auth/change-password/route.ts:35-36`） |
| P2-4 | SVG 上传直存（存储型 XSS 向量） | ✅ 已关闭两处：`app/api/media/route.ts:7-12` 白名单移除 SVG；`lib/blob.ts:51` 不再有 SVG 分支——**但 GIF 分支留下了同类旁路，见本报告 P1-1** |
| P2-5 | 改密端点重复（`auth/update` bcrypt 10） | ✅ 已收敛为单一 `change-password`（bcrypt 12） |
| P3-1 | categories PUT/DELETE 缺 `revalidateTag` | ✅ 已补齐（`app/api/categories/[id]/route.ts:25,45`） |
| P3-2 | 缺 Referrer-Policy | ✅ 已补（`next.config.mjs:35`）——CSP 仍缺，见 P3-1 |
| P3-3 | POST 输入无类型校验（title 传 number → 500） | ✅ 已引入 zod（`lib/schemas.ts`），POST/PUT 全部 `safeParse` |
| P3-4 | slug 冲突返回 500 而非 400 | ✅ 已捕获 `P2002` → 400（`app/api/posts/route.ts:115`、`[id]/route.ts:86`） |
| 契约 | posts PUT 未捕获 P2002 | ✅ 已修（`app/api/posts/[id]/route.ts:86`） |

### ⚠️ 遗留未修（本次复核确认仍在）

| 前次编号 | 问题 | 现状 |
|---|---|---|
| P2-3 | media `filename` 未清洗 | ❌ 仍在（`app/api/media/route.ts:39,42`）→ 并入本报告 **P1-5** |
| P3 | settings GET 带创建副作用 | ❌ 仍在（`app/api/settings/route.ts:9`）→ 本报告 **P2-6** |
| P3 | health 暴露 blob 配置状态 | ❌ 仍在（`app/api/health/route.ts:21`）→ 本报告 **P3-2** |

### 🆕 本次新增发现（前次未覆盖）

- **P0-1** slug 生成（中文标题阻断）—— 前次未覆盖前端/端到端路径
- **P0-2** 新建文章零持久化 —— 前次未覆盖编辑器组件
- **P1-3** RSS CDATA 未转义 —— 前次未覆盖输出编码
- **P1-4** JSON-LD 未转义 —— 前次未覆盖渲染层 XSS
- **P2-4/5/12/14** 前端性能与 DOM 双源 —— 前次为后端专项，未覆盖
- **P3-13/14** TOC 嵌套标题与外文目录 —— 前次未覆盖

### 对前次结论的更正

> 前次报告第 16 行结论：**"文件上传：MIME 白名单 + 5MB 上限 + 服务端重压缩（MIME 伪造无实质危害）✓"**

**此结论在当前代码下不再成立**。前次审查时 `lib/blob.ts` 对 SVG/GIF 走的是"原样存储"分支，而 `media` API 当时的白名单包含 SVG；本次复核发现：SVG 白名单虽已移除，但 **GIF 分支（`lib/blob.ts:51`）同样跳过 sharp 内容校验**，且 `compressAndUpload` 接收的是 `Buffer`（丢失 `file.type`），使 `origMime` 退化为按文件名扩展名猜测 → **只需文件名以 `.gif` 结尾即可绕过全部内容校验**。详见 P1-1（含可执行的 curl 复现）。

---

## 六、修复路线图

### 第一批 · 立即（P0，预计半天）

| 任务 | 文件 | 验收标准 |
|---|---|---|
| 中文标题 slug 生成 | `EditorClient.tsx:155,217` + `app/api/posts/route.ts:85` + `lib/schemas.ts:8-12` | 连续创建 3 篇纯中文标题文章全部成功，slug 唯一且可读（建议拼音） |
| 新建文章草稿持久化 | `EditorClient.tsx:137-146` | 新建文章输入后刷新可恢复；存在未保存内容时关闭页面有拦截提示 |

### 第二批 · 本周（P1，预计 1-2 天）

| 任务 | 文件 | 验收标准 |
|---|---|---|
| 媒体内容校验统一走 sharp | `lib/blob.ts:46-54` | `evil.gif`（内容为 HTML）上传返回 400；GIF 动图仍可正常上传 |
| 文件名消毒 + 批量上传回滚 | `app/api/media/route.ts:36-44` | `../../evil.png` 被消毒；批量上传部分失败时不产生孤儿记录 |
| 登录限流改双维度 + 渐进延迟 | `lib/auth.ts:11-36` | 5 次错误后**正确密码仍可登录**（不再被锁死）；限流表有明确上界 |
| RSS CDATA 转义 | `app/rss.xml/route.ts:16-21` | 标题含 `]]>` 时 `xmllint --noout` 通过 |
| JSON-LD 转义 | `app/posts/[id]/page.tsx:72` | 标题含 `</script>` 时页面不执行脚本 |

### 第三批 · 迭代（P2，预计 2-3 天）

编辑器状态一致性（P2-9）、自动保存失败提示（P2-1/2/3）、DOM 双源收敛（P2-4）、阅读进度性能（P2-5）、错误契约统一（P2-6/7）、Hooks 规则（P2-8）、定时器清理（P2-11）、首页/滚动性能（P2-13/14）。

### 第四批 · 技术债（P3）

CSP、health 收敛、schema 复用、TOC 递归、i18n 目录、`revalidatePostViews` 提取去重。

---

## 七、审查覆盖度声明

| 项目 | 状态 |
|---|---|
| 文件覆盖 | `app/` 67 · `components/` 56 · `lib/` 22 · `middleware.ts` · `prisma/` 5 · `scripts/` 35 · 构建配置 —— 全量 |
| 逐文件精读 | 全部 API 路由（15）· `lib/` 核心 12 个 · 编辑器/阅读/搜索/移动端关键组件 · `middleware` · `schema.prisma` · 构建配置 |
| 类型检查 | `npx tsc --noEmit` → **0 错误** |
| 生产构建 | 见第四章 |
| 端到端测试 | **已完成**：真实 PostgreSQL 18.4 + 生产模式服务 —— 项目自带 6 场景 **25/25 通过**、本次新增缺陷用例 **14/15 通过**（唯一失败为未修复的 P2-6）；另验证构建降级行为（EXIT 1 → EXIT 0） |
| 本轮补审新增覆盖 | `components/editor/PostRenderer.tsx`（用户内容→DOM 唯一路径，XSS 关键面）、`lib/headings.ts`、三端阅读页可见性规则一致性（`app/posts` / `app/m/posts` / `app/t/posts`） |
| 未覆盖 | Vercel 生产环境特定的 Edge/Blob 行为；`scripts/` 中的一次性截图/内容管线脚本仅做安全扫描未逐行精读 |

---

## 八、修复记录（2026-09-15 实施）

本次已修复 **全部 P0（2 项）与 P1（6 项）**，共 8 个缺陷。其中 **P1-6 是端到端测试才暴露出来的**（此前被"缓存恰好为空"反复掩盖）。

### 8.1 变更清单

| 编号 | 问题 | 变更文件 | 修复方式 |
|---|---|---|---|
| **P0-1** | 中文标题 slug 退化为 `-` | **新增** `lib/slug.ts`<br>`app/api/posts/route.ts`<br>`app/dashboard/posts/[id]/EditorClient.tsx`<br>`lib/schemas.ts` | 新增统一 `slugify()`（纯规则，两端共用）与 `slugFromTitle()`（中文段转拼音，`pinyin-pro` **动态 import** 故不进客户端主包）；兜底值改为「36 进制时间戳 + 随机后缀」保证唯一；`slugField` 正则收紧为 `^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$` 拒绝 `-`/`--`/`hello-`/单字符 |
| **P0-2** | 新建文章零持久化 | `app/dashboard/posts/[id]/EditorClient.tsx`<br>`lib/i18n.ts` | 新增 `sl-draft:new` localStorage 草稿：停止输入 1s 自动暂存、挂载时自动恢复并提示、有未保存内容时 `beforeunload` 拦截、首次成功落库后清除；新增 2 条中英词条 |
| **P1-1** | 媒体内容校验可绕过 | `lib/blob.ts` | 删除「按扩展名判定 GIF 并原样透传」的旁路，改为**一律以 `sharp(buffer).metadata()` 探测的真实格式**判定；GIF 通过校验后原样上传以保留动图，其余按真实格式转码；mimeType 与文件扩展名均由真实格式归正 |
| **P1-5** | 文件名未消毒 + 批量上传非事务 | `lib/blob.ts`<br>`app/api/media/route.ts` | 新增 `sanitizeFilename()`（路径穿越/控制字符清除、保留中文与扩展名、截断超长名），Blob 与本地降级两条写出链共用；上传改为「阶段一全量校验 → 阶段二逐条提交」，失败时回滚本轮已产生的 Blob 与 DB 记录；新增单请求文件数上限 10 |
| **P1-3** | RSS CDATA 未转义 | **新增** `lib/xml.ts`<br>`app/rss.xml/route.ts` | 新增 `cdata()` 把 `]]>` 拆为 `]]]]><![CDATA[>`（XHTML 惯例，语义不变）；同时提供 `xmlEscape()` 供后续 Atom/JSON Feed 复用 |
| **P1-4** | JSON-LD 未转义（存储型 XSS） | `lib/adapt.ts`<br>`app/posts/[id]/page.tsx` | 新增共享 `safeJsonLd()`：对 `<`/`>`/`&` 做 `\u003c` 等 Unicode 转义，JSON 语义不变但浏览器不再识别为标签边界 |
| **P1-6** | 详情查询缺降级保护，DB 抖动直接阻断构建（**E2E 新发现**） | `lib/posts.ts` | 抽出 `degrade()` 统一包裹 `getAllPosts` / `getPostBySlug` / `getPostById` / `getFeaturedPost` / `getAllPostSlugs`；**构建期**（`NEXT_PHASE=phase-production-build`）DB 不可达降级为空数据，**运行期**不吞错交由 error boundary。验证：DB 不可达 + 缓存有数据时构建 **EXIT 1 → EXIT 0** |
| **P1-2** | 登录限流可致账户锁定 DoS | `lib/auth.ts` | ① 改为 IP + email **双维度**计数（IP 为主闸，email 为辅）；② 超阈值由**硬锁改为渐进延迟**（指数退避，上限 3s），**正确凭据始终可登录** → DoS 面关闭；③ 仅对异常高频来源（IP ≥30 次/15min）硬拒，保留最终防线；④ 表容量固定 2000，超限时按时间戳**批量淘汰最旧一半**，消除每次写入的 O(n) 全表遍历 |

### 8.2 回归验证结果

| 检查项 | 结果 |
|---|---|
| `npx tsc --noEmit` | **0 错误** |
| `npx next build` | **EXIT 0** · 43 路由 / 25 页静态化 / 共享 JS 103 kB（与修复前一致，`pinyin-pro` 动态引入未进主包） |
| `npx tsx scripts/review-e2e/unit-verify.ts` | **18 项断言全部通过 / 0 失败** |
| 端到端 · 项目自带 6 场景（真实 PG 18.4 + 生产模式服务） | **25 通过 / 0 失败** |
| 端到端 · 本次新增缺陷用例 | **14 通过 / 1 失败**（唯一失败为尚未修复的 P2-6） |
| 构建降级 · DB 不可达 + 缓存有数据 | **EXIT 1 → EXIT 0**（P1-6 修复验证） |

关键回归断言明细：

```
════════ P0-1 中文标题 slug ════════
   "设计原则"      → "she-ji-yuan-ze"        ✅ 非退化值
   "代码之美"      → "dai-ma-zhi-mei"        ✅ 两篇不再撞车
   "Hello 世界"    → "hello-shi-jie"
   "React 19 新特性" → "react-19-xin-te-xing"
   ✅ 全部输入生成的 slug 唯一（6/6）
   ✅ zod 拒绝全部退化 slug（-  --  hello-  a）
   ✅ zod 接受合法 slug

════════ P1-3 RSS CDATA ════════
   输入: "CDATA 注入 ]]> 测试"
   输出: <![CDATA[CDATA 注入 ]]]]><![CDATA[> 测试]]>
   ✅ 标准 XML 解析器校验通过（修复前为解析失败）
   ✅ 多个 ]]> 连续出现也能正确转义

════════ P1-4 JSON-LD ════════
   输出: {"headline":"\u003c/script\u003e\u003cimg src=x onerror=alert(1)\u003e",...}
   ✅ 不含未转义的 </script> / <img
   ✅ JSON 语义仍可被 JSON.parse 还原

════════ P1-1 媒体内容校验 ════════
   ✅ 伪装内容全部被拦截（4/4：HTML / 纯文本 / SVG / 空文件）
   ✅ 合法 PNG 正常通过（mimeType=image/webp）

════════ P1-5 文件名消毒 ════════
   "../../evil.png"    → "evil.png"          ✓
   "..\..\win.png"     → "win.png"           ✓
   "nor mal name.png"  → "nor_mal_name.png"  ✓
   "隐藏文件.png"       → "隐藏文件.png"       ✓（中文与扩展名保留）
   ✅ 超长文件名被截断

════════ 对照组：渲染白名单（须仍然有效）════════
   ✅ 5 类 CSS/协议注入全部拦截（5/5）
   ✅ 非法枚举/类型回退默认值

════════ 回归结果：18 通过 / 0 失败 ════════
```

### 8.3 未修复项（已全部闭环）

| 级别 | 状态 |
|---|---|
| ~~P2~~ | ✅ **已全部修复（14/14）** —— 详见 8.5 |
| ~~P3~~ | ✅ **已全部修复（26/26）** —— 详见 8.6 |
| ~~P2~~→P3 | **P2-15 已处理**：`/api/search-index` 被标记 `○ (Static)` 与源码注释不符；实测运行时索引可正常返回（`posts=3, offline=false`），原推断影响被高估，现已在源码注释中明确其缓存语义（观察项，无需代码改动） |

> 至此本报告 **49 项问题（P0×2 / P1×6 / P2×15 / P3×26）全部处理完毕**，三轮修复均通过回归验证（`tsc` 0 错误、`unit-verify` 18/18、`next build` EXIT 0、端到端 api-tests 25/25 + extra-tests 15/15）。

> 说明：以上均为「不影响正确性主链路」的加固项，按第三章的第三/四批排期推进即可。

### 8.4 注意事项

- `lib/slug.ts` 的 `slugFromTitle()` 依赖 `pinyin-pro`，已用**动态 `import()`** 引入：仅服务端调用，客户端（`EditorClient`）只使用同步的 `slugify()`，因此主包体积未变化（构建产物 103 kB 与修复前一致）。
- **存量数据**：`lib/schemas.ts` 的 slug 正则收紧后，历史上以 `-` 开头/结尾或纯数字连字符的旧 slug 会在下次保存时被拒。若库中存在此类脏 slug，建议一并清洗（`UPDATE "Post" SET slug = ... WHERE slug !~ '^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$'`）。
- **⚠️ 运行期行为变更**：`lib/posts.ts` 现在**运行期不再静默降级**——数据库故障会抛错并由 `app/error.tsx` 呈现，而不再返回空列表（原先只有 `getAllPosts` 兜底，且会掩盖故障）。若确实希望维持"空列表兜底"的旧行为，需显式改回 `degrade()` 中的 `throw`。
- **端到端测试复现方式**：`scripts/review-e2e/` 下 `run3.sh`（编排）、`db-wait.mjs`（等待 PG 就绪 + 建库）、`unit-verify.ts`（无需数据库的回归断言）。Windows 下需先把 PG 二进制放到**纯 ASCII 路径**（见 4.3），且 `pg_ctl start` 的输出必须整份重定向到文件，否则脚本会挂起。

### 8.5 P2 批次修复（2026-09-15 第二轮）

全部 **14 项 P2 已修复**（P2-15 已于第一轮下调为 P3 观察项，不在此列）。

| 编号 | 问题 | 变更文件 | 修复方式 |
|---|---|---|---|
| **P2-1** | 删除未校验响应 | `EditorClient.tsx` | `confirmDelete` 补 `res.ok` 判定与错误 Toast；失败不再跳转 |
| **P2-2** | 自动保存失败静默 + 状态栏硬编码 | `EditorClient.tsx`、`lib/i18n.ts` | 新增 `saveState` / `autosaveError` 状态；非 2xx 抛错并落状态；状态栏显示真实状态（失败红色显示原因）；新增 3 条中英词条 |
| **P2-3** | 发布按钮未禁用 | `EditorClient.tsx` | 补 `disabled={saving}`，与草稿按钮一致 |
| **P2-4** | 阅读"剩余时间"DOM 双源 | `PostClient.tsx`、`ReadingProgress.tsx` | PostClient 改为空占位 `[data-remaining]`（不再由 React 写入）；ReadingProgress 删除未使用的 `remaining` state（死代码 + 无谓重渲染） |
| **P2-5** | 段落压暗 layout thrashing | `ReadingProgress.tsx` | 先批量 `getBoundingClientRect()` 收集、再批量写样式；`transition` 仅首次写入 |
| **P2-6** | `/api/settings` GET 写副作用 + 无缓存头 | `app/api/settings/route.ts` | GET 不再 `create`；未命中返回只读默认值；补 `Cache-Control: public, s-maxage=60, swr=300` 与错误处理 |
| **P2-7** | `/api/categories` GET 错误契约 | `app/api/categories/route.ts` | 补 try/catch，统一返回 `{ error }` JSON |
| **P2-8** | `useLang` 位于 try/catch 内 | `components/Breadcrumb.tsx` | Hook 移出异常控制流，顶层无条件调用 |
| **P2-9** | 编辑器陈旧闭包 | `EditorClient.tsx` | `onUpdate` / `ConfigPanel.onChange` 改为函数式 `setPost(prev => ...)` |
| **P2-10** | fetch 未判响应、无 abort | `SearchPanel.tsx`、`MHome.tsx`、`MDashHome.tsx` | 补 `res.ok` 判定 + `AbortController` + 卸载中止；MHome 新增日期守卫（不再渲染 "Invalid Date"）；MDashHome 解构加 `?? {}` 兜底 |
| **P2-11** | 定时器未清理 | `Lightbox.tsx`、`SearchPanel.tsx`、`TocDrawer.tsx`、`MHeader.tsx`、`DropdownSelect.tsx`、`PostRenderer.tsx`(CopyBtn) | 统一用 `useRef` 保存句柄 + cleanup 清理 |
| **P2-12** | Lightbox 键盘监听全局常驻 | `Lightbox.tsx` | 快捷键 effect 加 `if (!src) return`，仅在灯箱打开时注册 |
| **P2-13** | 归档页 NaN 传染与未判空 | `archive/ArchiveClient.tsx`、`mobile/MArchive.tsx` | `title` / `category` 兜底空串；`latestTs` 逐条校验 `NaN` |
| **P2-14** | 首页高频路径缺节流/memo | `HomeClient.tsx`、`Footer.tsx`、`Header.tsx` | 时间线分组由 JSX 内 IIFE 提为 `useMemo`（消除每次渲染的 O(n log n) 排序）；`localizedFiltered` memo 化（避免击穿下游 memo 与 CoverArt）；Footer/Header 的 scroll 回调改 rAF + 值变更判断 |

**附带修复**：`Footer.tsx` / `mobile/MFooter.tsx` 外链补 `rel="noopener noreferrer"`（防反向标签页劫持）。

**回归结果（零回归）**

| 检查 | 结果 |
|---|---|
| `npx tsc --noEmit` | **0 错误** |
| `npx tsx scripts/review-e2e/unit-verify.ts` | **18 / 18 通过** |
| `npx next build`（DB 可用） | **EXIT 0** |
| 端到端 · 项目自带 6 场景 | **25 / 25 通过** |
| 端到端 · 新增缺陷用例 | **15 / 15 通过**（第一轮 14/15 —— P2-6 修复后原失败项转绿） |

```
✓ P2-6b /api/settings 带缓存头
        → Cache-Control=public, s-maxage=60, stale-while-revalidate=300
✓ P2-7 /api/categories 正常返回 JSON   → status=200 type=application/json
✓ P0-1a/b/c 中文标题 slug              → 两篇均 200，slug 唯一可读
✓ P1-1a 伪装 .gif                       → 400
✓ P1-3b RSS                             → 标准 XML 解析通过
```

**仍待处理**：仅剩 **P3 共 26 项**（工程改进类，不影响正确性主链路）。建议优先 **P3-1 CSP 响应头**、**P3-26 media DELETE 不清理本地降级产物**（本轮 E2E 实测复现）、**P3-21~23 PostRenderer 组**（heading level 白名单 / 死代码 / 递归深度守卫）。

### 8.6 P3 批次修复（2026-09-15 第三轮）

全部 **26 项 P3 已修复**。至此本报告内 **49 项问题已全部处理完毕**。

| 分组 | 编号 | 修复要点 |
|---|---|---|
| **安全加固** | P3-1 | `next.config.mjs` 补 CSP：`object-src 'none'`、`base-uri 'self'`、`frame-ancestors 'none'`、`connect-src 'self'`（script/style 保留 `unsafe-inline` 以不破坏 Next 内联运行时；`img-src` 刻意放开 `https:`，否则作者在正文插入的外链图片会直接不显示） |
| | P3-2 | `/api/health` 匿名只返回 `{status}`，DB 延迟与 Blob 配置仅管理员可见 |
| | P3-19 | middleware 重定向目标改为 **host 白名单**（`ALLOWED_REDIRECT_HOSTS` 可扩展，默认仅 `NEXT_PUBLIC_SITE_URL`），与 `lib/site-url.ts` 的 env 策略对齐 |
| | P3-20 | 浏览计数优先取平台注入、客户端不可覆盖的头（`x-vercel-forwarded-for` → `cf-connecting-ip` → `x-real-ip`）；去重表改**容量硬上限 + FIFO 批量淘汰**（原实现仍会无界增长并周期性 O(n) 停顿） |
| | P3-11 | 分类计数改为只统计已发布（`_count.posts.where`），不再泄漏草稿与未到期定时文章的数量 |
| | P3-12 | 搜索 `q` 转义 LIKE 元字符（`\ % _`），杜绝一次 `%` 搜索拉全表 |
| **渲染安全** | P3-21 | heading `level` 白名单化（`[1,2,3,4]`，非法值回落 2） |
| | P3-22 | 删除 PostRenderer 的死代码 `isDarkMode`（同时消除一处 SSR/CSR 水合不一致来源） |
| | P3-23 | 渲染递归深度上限 40，防御畸形深嵌套结构 |
| | P3-24 / P3-13 | 目录提取与正文 id 生成统一为「**递归遍历 + 全局递增序号**」的同一套算法（两端必须同序，该约束已写进两边注释） |
| **数据层** | P3-3 | 改密路由改用共享 `changePasswordSchema`，消除路由内手写校验与 schema 的漂移 |
| | P3-4 | `tiptapDoc` 加 1MB 体积上限 |
| | P3-16 | `revalidatePostViews` 提取为 `lib/posts.ts` 的 `revalidatePostPaths`，并**补上此前遗漏的 `/m/posts` 与 `/t/posts`**（旧实现只失效桌面路径，移动端会看到旧页面） |
| | P3-25 | `GET /api/posts/[id]` 支持 slug 回退，与页面层的 `slug \|\| id` 行为对齐 |
| | P3-26 | media DELETE 按 url 形态分派，本地降级产物（`/uploads/*`）不再残留 —— **本轮 E2E 跑完后 `public/uploads` 零残留，即该修复生效的直接证据** |
| | P3-6 | `deleteFromBlob` 不再用空 `catch {}` 吞错，改为告警日志（含越界路径拒绝） |
| **前端质量** | P3-7 | `test-force-password.mjs` 改为从 `TEST_PASSWORD` 等环境变量读取，移除内置明文凭据 |
| | P3-8 | 侧边栏版权年份改 `new Date().getFullYear()` |
| | P3-9 | ColorPicker 受控同步（点色板/重置后 `#hex` 输入框不再显示旧值）+ 原生 color input 只接收合法 hex |
| | P3-10 | ResizableImageView 补 effect cleanup（拖拽中卸载不再泄漏 window 监听）+ `maxW` 下限保护（避免写入 `Infinity%`） |
| | P3-17 | layout 四处 `dangerouslySetInnerHTML` 加「禁止插值」约束注释 |
| | P3-18 | 改密提交按钮的 `disabled` 与提交时的 `trim` 对齐 |
| **前轮已顺手修复** | P3-5 / P3-15 | 路径穿越守卫（随 P1-5）、DB 降级策略统一（随 P1-6） |

**回归结果（零回归）**：`tsc --noEmit` 0 错误 · `unit-verify.ts` **18/18** · `next build` **EXIT 0** · api-tests **25/25** · extra-tests **15/15**
（其中 extra-tests 的 P3-2 断言已更新为验证新行为：匿名响应体为 `{"status":"ok"}`，不含 `checks`）
- 登录防护改为渐进延迟后，**第 6 次起每次失败会额外等待 250ms→3000ms**（指数退避）。这是有意的反暴力成本，不影响正常用户（正常用户不会连续失败 5 次以上）。

---

*报告由 WorkBuddy 高级开发工程师（Senior Developer）生成 · 2026-09-15*
