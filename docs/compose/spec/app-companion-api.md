---
feature: app-companion-api
status: delivered
updated: 2026-09-20
branch: feat/app-companion-api
commits: 8846f58c0c9a319acbc91c5970e0e748cdbb0bf5..d791277f40f1694e5bb767593d0dd9286427b841
---

# Android App Web 配套（§3 完整）

## Report

**What was built** — 在 Web 仓落地 Android App 的 §3 完整后端配套：`ApiToken`/`AppDevice`/`DeletedPost` 三表；`lib/app-auth.ts` Bearer 鉴权（明文一次、SHA-256 存储、撤销审计）；`/api/app/tokens|devices|sync` 与 `/api/covers/[id]` PNG 封面；全部写接口接入 session||bearer；文章硬删写 tombstone；发布跃迁时 FCM 广播（未配置 env 自动跳过）；改密撤销全部 Token；`/privacy` 隐私页；后台「App 令牌」管理页（创建/复制明文/撤销/设备列表）；`docs/api/tiptap-contract.md` 跨端渲染契约。同步契约：非法 `since` 全量降级不 400，仅合法日期超窗 90 天 400。

**Verification** — 工作区 `feat/app-companion-api` 实测：`npx tsc --noEmit` PASS；`npm run lint` PASS；`npx next build` PASS（含 `/api/app/*`、`/api/covers/[id]`、`/privacy`、`/dashboard/tokens`）；`prisma db push` PASS；`scripts/api-tests.mjs` 25/0（`ALLOW_FIXTURES=1` 重置夹具后）；`scripts/app-companion-smoke.mjs` 34/0（Token 生命周期、Bearer 写、sync 游客/登录可见性、非法 since 全量、封面 PNG/缓存/草稿鉴权、tombstone、撤销后 401）。独立 Review 第一轮 critical → 修复 commit `d791277` → 复审 **pass-with-nits**，critical 与 major 修复均确认落地。

**Journey log**
- Review 抓到的 critical 是契约偏差而非功能缺失：实现写了「非法 since → 400」，Spec S2.5 明确要求全量降级——smoke 最初只测了 90d 越界，未测非法 since；已补用例。
- `next start` 喂的是旧 `.next`：修代码后必须 rebuild，并杀掉占用端口的旧进程，否则冒烟会「测到旧逻辑」。
- `mapPost` 在 `lib/posts.ts` 为模块私有，sync「复用 mapPost」只能内联同形 DTO；文档已改为如实描述。
- FCM 若在 `isPublicPost(post)` 上无条件推送，已发布文章每次编辑都会吵醒全站设备——必须做发布跃迁判断。
- 复审 residual（改密与撤销 Token 非同一事务、smoke 未断言草稿封面 Cache-Control、墓碑 90 天 GC）记入观察项，不阻断交付。

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
- 撤销 = 置 `revokedAt`，不物理删。改密成功后全局撤销全部有效 Token（单管理员模型，无 `userId`）。
- Tombstone 保留 90 天语义与 sync 窗口对齐（读路径强制；写侧 GC 为观察项）。

### S2.2 鉴权：`lib/app-auth.ts`

- `bearerToken(req)`：解析 `Authorization: Bearer <plain>` → `sha256(plain)` → 查 `ApiToken`（`revokedAt = null`）→ 命中则 fire-and-forget 更新 `lastUsedAt`，返回 `{ ok: true, tokenId }`；否则 `null`。
- `requireSessionOrBearer(req)`：Cookie 会话优先 → `{ kind: "session", session }`；否则 Bearer → `{ kind: "bearer", tokenId }`；都无 → `null`。
- **强制改密门禁只作用于 `kind === "session"`**。
- 不修改 `lib/auth.ts` 的 Credentials 限流逻辑。

写接口统一改法：

```ts
const gate = await requireSessionOrBearer(req)
if (!gate) return apiError(401, "未登录")
if (gate.kind === "session" && passwordChangeRequired(gate.session))
  return apiError(403, "请先修改默认密码")
```

**已接入 bearer 的写接口**：posts POST/PUT/DELETE、thoughts POST/PUT/DELETE、categories POST/PUT/DELETE、media POST/DELETE、settings PUT、auth change-password POST。`GET /api/app/tokens`、`GET /api/app/devices` 仍为 Cookie 会话 only。

### S2.3 Token 管理 API `app/api/app/tokens/route.ts`

门禁：Cookie `auth()` + `passwordChangeRequired`。

| 方法 | 行为 |
|------|------|
| GET | `[{ id, name, createdAt, lastUsedAt, revokedAt }]`，永不返回 hash/明文 |
| POST `{ name }` | 32 字节随机 hex；存 SHA-256；明文仅本次返回 |
| DELETE `?id=` | `revokedAt = now()`；幂等 `{ ok: true }` |

### S2.4 设备 API `app/api/app/devices/route.ts`

| 方法 | 鉴权 | 行为 |
|------|------|------|
| POST `{ fcmToken, platform? }` | Bearer 或 Session | upsert；platform 默认 android |
| DELETE `{ fcmToken }` | Bearer 或 Session | 按 token 删除，幂等 |
| GET | Cookie Session | 设备列表 |

### S2.5 增量同步 `app/api/app/sync/route.ts`

`GET /api/app/sync?since=<ISO>&pageSize=<n>`

**可见性**

| 调用方 | posts | 内容字段 |
|--------|-------|----------|
| 无 Bearer | `publicPostWhere()` | `stripPostHeavy` |
| 有 Bearer | 全部 status | 内联 DTO（**含 content**）；与 `mapPost` 的 headings/displayDate 差异可接受 |

**since 语义**

- 缺失或**非法/非日期**：全量模式（warn），**绝不 400**；全量 `take = min(pageSize, FRONT_LIST_LIMIT+1)`。
- 合法：`updatedAt > since`。
- 早于 `now-90d`：`400 { error: "同步窗口过期，请全量重拉" }`。

响应：`postsChanged` / `deletedIds` / `categories` / `thoughtsChanged` / `settings` / `serverTime`。缓存 `private, no-store`。`pageSize` 1–200 默认 100。

### S2.6 删除墓碑

`DELETE /api/posts/[id]` 在 `prisma.post.delete` **成功后** upsert `DeletedPost`；墓碑写入失败只 `console.error`，**不**把已删文章的响应打成 500。

### S2.7 封面 PNG

`lib/cover-derive.ts` 派生 + `lib/cover-svg.ts` 渲染入口。seed 标题源 **`post.title`**（与 `CoverArt.tsx` 一致）；分类 `name || nameZh`。`w=800|1600`，`sharp` 出 PNG。

缓存：非公开 → `private, no-store`；公开+`v` → immutable 1y；公开无 `v` → `max-age=300`。可见性与 posts GET 一致（Bearer 可见草稿）。

### S2.8 FCM 与安全

- `lib/fcm.ts`：未配置 `FIREBASE_SERVICE_ACCOUNT` 或无设备则跳过；失败只 log。
- 推送条件：POST 新建且已公开；PUT **仅发布跃迁**（更新前非公开且更新后公开）。
- 定时到达不自动推送。
- 改密成功 → 撤销全部 `ApiToken`。
- Token 明文一次、错误体 `{error:中文}`、封面不接受自定义 SVG。

### S2.9 隐私页

`app/privacy/page.tsx` 公开 RSC：FCM token / 阅读计数 IP 15min 去重 / 无广告与追踪 / Token 撤销 / 联系方式 + English summary。

### S2.10 后台 Token 页

`/dashboard/tokens` + `TokenManager`：创建（明文一次+复制）、列表、撤销、设备表；Sidebar「App 令牌」。

### S2.11 契约文档

`docs/api/tiptap-contract.md`：节点/marks 白名单、heading 算法、三白名单、深度/1MB、pageConfig、同步与封面指针。

### S2.12 错误与安全红线

见 S2.8；游客 sync 不得泄漏草稿 content（smoke 已断言）。

## [S3] Out of Scope

- Android 新仓 `slowlog-android` 本身。
- `App123/开发文档.md` 是否入库。
- 定时发布到达时刻的自动 FCM。
- `/api/app/strings`；国行推送；Play 上架流水线。
- 封面与前端 CoverArt 像素级一致（规则级同源）。
- `updatedAt` 索引、tombstone 90 天写侧 GC、改密与撤销 Token 的事务包装（观察项）。

## Tasks

- [x] T1: Prisma 三模型 + `db push` + generate — acceptance: schema 同步，client 可用（covers: S2.1）
- [x] T2: `lib/app-auth.ts` + zod schemas — acceptance: 导出 bearerToken/requireSessionOrBearer；tsc 通过（covers: S2.2; depends: T1）
- [x] T3: `/api/app/tokens` — acceptance: 未登录 401；明文一次；GET 无 hash；撤销后写 401（covers: S2.2, S2.3; depends: T2）
- [x] T4: 写接口 bearer 接入 — acceptance: 无 token 401；有效 token 可写；撤销后 401（covers: S2.2; depends: T2）
- [x] T5: `/api/app/devices` — acceptance: Bearer upsert/注销；Session GET 列表（covers: S2.4; depends: T2）
- [x] T6: DELETE 写 tombstone — acceptance: 删除成功后墓碑存在；墓碑失败不阻断删除响应（covers: S2.6; depends: T1）
- [x] T7: `/api/app/sync` — acceptance: 全量/增量；非法 since 全量 200；超窗 400；游客无 content；Bearer 含 content；deletedIds 可观测（covers: S2.5; depends: T4, T6）
- [x] T8: covers PNG + cover-derive/cover-svg — acceptance: 公开 200 image/png；w=1600；公开+v immutable；草稿游客 404/Bearer 200；草稿 private no-store（covers: S2.7; depends: T2）
- [x] T9: FCM + 发布挂钩 + firebase-admin — acceptance: 未配置 env 时发布仍 200；仅发布跃迁触发路径（covers: S2.8; depends: T4）
- [x] T10: `/privacy` — acceptance: 无登录可访问，中英声明，构建含路由（covers: S2.9）
- [x] T11: 后台 Token/设备页 + Sidebar — acceptance: 可创建/复制明文/撤销/看设备（covers: S2.10; depends: T3, T5）
- [x] T12: `docs/api/tiptap-contract.md` — acceptance: 含 heading 算法与三白名单（covers: S2.11）
- [x] T13: 验证门禁 — acceptance: tsc/lint/build PASS；api-tests 25/0；smoke 34/0；复审 critical 闭环（covers: S2.1–S2.8; depends: T3–T9）
