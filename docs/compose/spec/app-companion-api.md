---
feature: app-companion-api
status: in-progress
updated: 2026-09-20
branch: feat/app-companion-api
commits: # filled at delivery
---

# Android App Web 配套（§3 完整）

## Report

（交付后填写）

## [S1] Problem

SlowLog 计划中的 Android 原生 App（见主仓 `App123/开发文档.md`）需要 Web 仓提供配套后端：长期 API Token 鉴权、设备注册与推送、增量同步（含删除 tombstone）、封面 PNG 接口、隐私政策页。当前 Web 仓仅有 Cookie 会话鉴权，硬删无墓碑，封面只有客户端 SVG，App 无法安全地离线同步或上架。

## [S2] Design

### S2.1 数据模型（`prisma/schema.prisma` 追加）

```prisma
model ApiToken {
  id         String    @id @default(cuid())
  name       String
  tokenHash  String    @unique
  createdAt  DateTime  @default(now())
  lastUsedAt DateTime?
  revokedAt  DateTime?
  @@index([tokenHash])
}

model AppDevice {
  id         String   @id @default(cuid())
  fcmToken   String   @unique
  platform   String   @default("android")
  lastActive DateTime @default(now())
  createdAt  DateTime @default(now())
}

model DeletedPost {
  postId    String   @id
  deletedAt DateTime @default(now())
  @@index([deletedAt])
}
```

- 明文 Token 只在 POST 创建时返回一次；DB 只存 SHA-256 hex。
- 撤销 = 置 `revokedAt`，不物理删。
- Tombstone 保留 90 天语义与 sync 窗口对齐（见 S2.5）。

### S2.2 鉴权：`lib/app-auth.ts`

- `bearerToken(req)`：解析 `Authorization: Bearer <plain>` → `sha256(plain)` → 查 `ApiToken`（`revokedAt = null`）→ 命中则 fire-and-forget 更新 `lastUsedAt`，返回 `{ ok: true, tokenId }`；否则 `null`。
- `requireSessionOrBearer(req)`：
  - Cookie 会话优先（`auth()`）→ `{ kind: "session", session }`；
  - 否则 Bearer → `{ kind: "bearer", tokenId }`；
  - 都无 → `null`。
- **强制改密门禁只作用于 `kind === "session"`**。Bearer 路径要求 Token 已由改密后的管理员创建（`/api/app/tokens` 本身强制 `passwordChangeRequired`），不再二次检查。
- 不修改 `lib/auth.ts` 的 Credentials 限流逻辑。

写接口统一改法（在现有 `if (!session)` 处替换，不改业务逻辑）：

```ts
const gate = await requireSessionOrBearer(req)
if (!gate) return apiError(401, "未登录")
if (gate.kind === "session" && passwordChangeRequired(gate.session))
  return apiError(403, "请先修改默认密码")
```

**必须接入 bearer 的写接口**（与开发文档清单一致）：

| 路由 | 方法 |
|------|------|
| `/api/posts` | POST |
| `/api/posts/[id]` | PUT、DELETE |
| `/api/thoughts` | POST |
| `/api/thoughts/[id]` | PUT、DELETE |
| `/api/categories` | POST |
| `/api/categories/[id]` | PUT、DELETE |
| `/api/media` | POST、DELETE |
| `/api/settings` | PUT |
| `/api/auth/change-password` | POST |

`GET /api/app/tokens`、`GET /api/app/devices`（设备列表）仍为 **Cookie 会话 only**（后台管理面）。设备 upsert/注销使用 Bearer（App 内）。

### S2.3 Token 管理 API `app/api/app/tokens/route.ts`

门禁：Cookie `auth()` + `passwordChangeRequired`（与 posts POST 相同两行）。

| 方法 | 行为 |
|------|------|
| GET | `[{ id, name, createdAt, lastUsedAt, revokedAt }]`，**永不返回 hash/明文** |
| POST `{ name }` | `name` 1–60 字；生成 32 字节 `crypto.randomBytes` → hex；存 SHA-256；响应 `{ id, name, token, createdAt }`（明文仅此一次） |
| DELETE `?id=` | 置 `revokedAt = now()`；已撤销则幂等 `{ ok: true }` |

zod：`tokenCreateSchema = { name: string.trim().min(1).max(60) }`（写入 `lib/schemas.ts`）。

### S2.4 设备 API `app/api/app/devices/route.ts`

| 方法 | 鉴权 | 行为 |
|------|------|------|
| POST `{ fcmToken, platform? }` | Bearer 或 Session | upsert by `fcmToken`；`platform` 默认 `"android"`；刷新 `lastActive` |
| DELETE `{ fcmToken }` | Bearer 或 Session | 按 `fcmToken` 删除，不存在也 `{ ok: true }` |
| GET | Cookie Session | 列出全部设备 `{ id, fcmToken, platform, lastActive, createdAt }` |

`fcmToken` 校验：非空，≤4096 字。

### S2.5 增量同步 `app/api/app/sync/route.ts`

`GET /api/app/sync?since=<ISO>&pageSize=<n>`

**可见性**

| 调用方 | posts | 内容字段 |
|--------|-------|----------|
| 无 Bearer | `publicPostWhere()` | `stripPostHeavy`（无 content/pageConfig 等） |
| 有 Bearer | 全部 status（含 draft/scheduled） | `mapPost` 全字段（**含 content**，供 App 渲染与本地搜索索引） |

**since 语义**

- `since` 缺失或非日期：全量模式。`posts` 取 `take = min(FRONT_LIST_LIMIT + 1, pageSize||100)` 上限（触顶 `warn`），与 `GET /api/posts` 无 page 时同量级；不 `400`。
- `since` 合法：只返回 `updatedAt > since` 的 posts / notes。
- `since` 早于 `now - 90d`：`400 { error: "同步窗口过期，请全量重拉" }`（App 丢弃 since 重拉）。

**响应 JSON**

```ts
{
  postsChanged: PostDTO[] | LitePost[],  // bearer: mapPost 全量；guest: stripPostHeavy
  deletedIds: string[],                  // DeletedPost.deletedAt > since（全量模式返回全部墓碑）
  categories: Category[] ,          // 与 GET /api/categories 同结构（含 _count.published）
  thoughtsChanged: ThoughtDto[],         // Note.updatedAt > since；全量取近 50 条
  settings: SiteSettings,                // SETTINGS_DEFAULTS + getSettings()
  serverTime: string                     // ISO
}
```

排序：posts 客户端契约 `publishedAt ?? createdAt desc`（接口本身 `orderBy: [{ updatedAt: "asc" }]` 不强制展示序）。

缓存：`Cache-Control: private, no-store`（含登录数据路径）；错误体 `{ error: 中文 }`。

`pageSize`：可选，1–200，默认 100，仅限制 postsChanged 行数。

### S2.6 删除墓碑

`app/api/posts/[id]/route.ts` DELETE 成功删除后：

```ts
await prisma.deletedPost.upsert({
  where: { postId: id },
  create: { postId: id },
  update: { deletedAt: new Date() },
})
```

在 `prisma.post.delete` 成功之后执行；delete 失败不写墓碑。

### S2.7 封面 PNG `app/api/covers/[id]/route.ts`

派生规则抽出到 **`lib/cover-derive.ts`**（服务端可引用，无 React）：

- `fnv1a(seed, max)`：`0x811c9dc5` / `0x01000193`，`Math.abs(h) % max`（与 `CoverArt.tsx` 一致）。
- `layout = fnv1a(title + id + "L", 8)`（L0–L7）。
- `seed = title + cat + id + tags.join(",")`；`variant = fnv1a(seed, 8)`；`variant4 = fnv1a(seed+"4", 4)`。
- 分类：已知 5 族否则 `fnv1a(cat, 5)` 归入；色板用 `ART_PALETTES` **实色 hex**（不用 CSS 变量）。
- `symbol = resolveTagSymbol(tags)`；`STAMP_CODE` 同 `CoverArt.tsx`。
- `abbr = CAT_ABBR[cat]`；`noNum = String(fnv1a(id||title, 9000)+1000).padStart(4,"0")`。
- 元信息条文案：`{abbr} · {noNum}` + 首标签大写（若有）。

`lib/cover-svg.ts`：纯函数 `renderCoverSvg(params, { width, height }) => string`，用同一套派生参数画 **静态 SVG**（直角、纸底、简化 collage 骨架 + 签名章 + meta 条）。**不要求与前端 CoverArt 像素级一致**；要求同 seeds → 同 layout 族/色/章/编号。

路由行为：

- `[id]` 支持 id 与 slug（与 posts GET 双兼容一致）。
- 可见性：无 Bearer 仅 `isPublicPost`；Bearer 可见草稿。
- Query：`w=800|1600`（默认 800，高度按 16:9 → 800×450 / 1600×900）；`v` 任意字符串作为缓存键提示（App 传 `updatedAt`）。
- 渲染：`sharp(Buffer.from(svg)).png().toBuffer()`。
- 缓存头：有 `v` → `public, max-age=31536000, immutable`；无 `v` → `public, max-age=300`。
- 错误：404 `{ error: "内容不存在" }`。

### S2.8 FCM 发布通知

- 依赖：`firebase-admin`（`package.json` 追加）。
- env：`FIREBASE_SERVICE_ACCOUNT`（JSON 字符串）；`.env.example` 增加说明行。**未配置时全部跳过，不报错。**
- `lib/fcm.ts`：
  - `isFcmConfigured()`；
  - `notifyPublishedPost(post: { id, title, titleZh, excerpt, excerptZh, slug })`：
    1. 未配置 / 无设备 → return；
    2. 动态 `import("firebase-admin/app")` 等，单例初始化；
    3. 读全部 `AppDevice.fcmToken`；
    4. multicast：`title = titleZh || title`，`body = (excerptZh||excerpt||"").slice(0,80)`，`data = { postId, slug }`；
    5. catch → `console.error` only，**绝不 throw**。
- 调用点（`fire-and-forget`，不 `await` 阻塞响应）：
  - `POST /api/posts`：`status === "published"` 且 `publishedAt` 空或 `<= now` 时；
  - `PUT /api/posts/[id]`：更新后 status 为 published 且进入公开可见（`isPublicPost`）时。
- 定时发布到达时刻：首版**不**自动推送（与开发文档一致）。

### S2.9 隐私页 `app/privacy/page.tsx`

公开 RSC 页，中文为主 + 英文摘要段。内容要点：FCM token 收集用途、阅读计数（IP + 15min 去重）、无广告 SDK、无第三方追踪、Token 撤销方式（后台 Token 管理）、联系邮箱（站点设置 footer 或占位 `admin@slowlog.dev`）。导航链到首页；Header/Footer 保持全站壳。`metadata.title = "隐私政策 | 慢日志"`。

不在 sitemap 排除之列（Play 审核需可公开访问）。

### S2.10 后台 Token 管理页

`app/dashboard/tokens/` + 轻量 client 组件 `components/dashboard/TokenManager.tsx`（或页面内 client）：

- 列表：name / createdAt / lastUsedAt / revokedAt 状态；
- 创建：name 输入 + 提交，**明文 Token 弹窗展示一次**，提供复制按钮并提示「仅显示一次」；
- 撤销：对未撤销 token 的按钮；
- 设备列表：GET devices 简表（fcmToken 截断展示 + lastActive）；
- 侧栏 `components/dashboard/Sidebar.tsx` 增加入口「App 令牌」；
- 文案中文，沿用后台 UI 直角/toast 惯例。

### S2.11 契约文档

新增 `docs/api/tiptap-contract.md`：从 `App123/开发文档.md` §1.3 固化——节点/marks 白名单、heading id 算法、三白名单语义、深度上限 40、正文 1MB、pageConfig 枚举、related 打分、阅读进度语义。跨端修改渲染时必须同步该文件（约定写在文档头部）。

### S2.12 错误与安全红线（全部新接口遵守）

- 错误体一律 `{ error: 中文 }`（`apiError`）。
- Token 明文仅创建响应一次；接口永不回显 hash。
- 封面不接受客户端自定义 SVG 输入。
- FCM 服务账号 JSON 不进 git（`AUDIT_FORBIDDEN` 已含 `.env*`）。
- sync 游客路径不得泄漏草稿 content。

## [S3] Out of Scope

- Android 新仓 `slowlog-android` 本身（Kotlin/Compose/Room/编辑器 UI）。
- 主仓 `App123/开发文档.md` 是否入库及路径调整。
- 定时发布到达时刻的自动 FCM 推送。
- `/api/app/strings` i18n 下发接口（App 首版 port 字典）。
- 国行推送通道、Play 上架流水线。
- 封面 PNG 与前端 CoverArt 的像素级一致（仅规则级同源）。
- 重构现有 GET 接口的缓存/排序语义。
- Cloudflare Workers 代理配置。

## Tasks

- [ ] T1: Prisma 三模型 + `db push` + generate — acceptance: `npx prisma validate` 通过；client 可 import `prisma.apiToken/appDevice/deletedPost`（covers: S2.1）
- [ ] T2: `lib/app-auth.ts` + `tokenCreateSchema`/device 校验 — acceptance: 模块导出 `bearerToken`/`requireSessionOrBearer`；tsc 无错（covers: S2.2; depends: T1）
- [ ] T3: `/api/app/tokens` GET/POST/DELETE — acceptance: 未登录 401；默认密码会话 403；POST 返回一次明文；GET 不含 hash；DELETE 后 token 写操作 401（covers: S2.2, S2.3; depends: T2）
- [ ] T4: 写接口 bearer 接入（§S2.2 清单全部路由） — acceptance: 无 token 写 401；有效 token 写通；撤销后写 401；Cookie 会话行为不变（covers: S2.2; depends: T2）
- [ ] T5: `/api/app/devices` POST/DELETE/GET — acceptance: Bearer 可 upsert/注销；Session GET 列表（covers: S2.4; depends: T2）
- [ ] T6: `DeletedPost` 写入 DELETE posts 处理器 — acceptance: 删除文章后 `deletedPost` 有该 postId；删除失败不产生墓碑（covers: S2.6; depends: T1）
- [ ] T7: `/api/app/sync` — acceptance: 无 since 返回全量骨架；有 since 仅增量；since>90d → 400；游客无草稿 content；Bearer 含草稿与 content；`deletedIds` 可观测（covers: S2.5; depends: T4, T6）
- [ ] T8: `lib/cover-derive.ts` + `lib/cover-svg.ts` + `/api/covers/[id]` — acceptance: 公开文章 200 + `image/png`；`w=1600` 尺寸正确；带 `v` 为 immutable 缓存头；草稿无 Bearer 404（covers: S2.7; depends: T2）
- [ ] T9: `lib/fcm.ts` + posts POST/PUT 挂钩 + `firebase-admin` + `.env.example` — acceptance: 未配置 env 时发布 API 正常 200 且无 throw；已配置时调用路径存在（单测/mock 或代码审查证据）（covers: S2.8; depends: T4）
- [ ] T10: `app/privacy/page.tsx` — acceptance: 无登录可访问，含中英文必要声明，构建包含该路由（covers: S2.9）
- [ ] T11: 后台 Token/设备管理页 + Sidebar 入口 — acceptance: 登录后台可见；可创建/复制明文/撤销/看设备列表（covers: S2.10; depends: T3, T5）
- [ ] T12: `docs/api/tiptap-contract.md` — acceptance: 文档存在且含 heading 算法与三白名单（covers: S2.11）
- [ ] T13: 验证门禁 — acceptance: `npx tsc --noEmit` exit 0；`npm run lint` exit 0；`scripts/api-tests.mjs`（若有 DB）全绿或基线失败标记；curl 冒烟 tokens/sync/covers（covers: S2.1–S2.8; depends: T3–T9）
