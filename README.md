# SlowLog 慢日志

> 慢下来，写点值得读的东西。

一个人的技术博客与写作后台：Next.js 15 App Router + React 19 + Tailwind v4 + Prisma/Postgres + NextAuth 5 + Tiptap 3，一套代码同时服务**五棵树**（桌面 / 移动 / 平板 / 桌面后台 / 移动后台），并给一个 Android 配套 App 提供同步接口。界面中英一键切换，内容中英成对存储。

- 前台：`/` 首页 · `/archive` 归档 · `/posts/[id]` 阅读页 · `/tag/[tag]` 标签聚合 · `/login` 登录 · `/privacy`
- 移动端：`/m`、`/m/archive`、`/m/posts/[id]`、`/m/login`、`/m/dashboard/*`（手机 UA 自动改写，地址栏不变）
- 平板端：`/t`、`/t/archive`、`/t/posts/[id]`（平板 UA 或 `view=tablet`；`/t` 一律 noindex，权重归桌面）
- 后台：`/dashboard`（概览 / 文章与编辑器 / 分类 / 媒体库 / 随想 / 设置 / 改密 / App 令牌）
- 接口面：`/api/*` 19 个 handler + `/rss.xml` + `/sitemap.xml` + `/robots.txt` + PWA manifest

## 怎么读这份文档

| 你是谁 / 要做什么 | 直接跳 |
|---|---|
| 只想跑起来 | [快速开始](#快速开始) → [环境变量](#环境变量) |
| 要改 UI / 文案 / 令牌 | [关键设计速查表](#关键设计速查表) → `docs/design/design-blueprint.md` |
| 新接手的会话或协作者 | **`docs/project-map.md`**（五棵树、请求流、数据层、坑位速查） |
| 排查线上问题 / 页面与预期不符 | [API 一览](#api-一览) + `docs/project-map.md` §十 坑位速查 |
| 看改了什么 | [`CHANGELOG.md`](./CHANGELOG.md) |

## 30 秒速览（现测于 v0.5.5）

| 维度 | 事实 |
|---|---|
| 源码文件 | **206** 个 ts/tsx（git 跟踪口径，不含 `lib/generated/` 与 `next-env.d.ts`） |
| 路由 | 生产构建 **54** 条：8 静态 + 2 SSG + 44 动态；`page.tsx` 30 个，其中后台 **16** 条（桌面 9 + 移动 7） |
| 边界 | `layout.tsx` 3、`loading.tsx` 18、error 边界 3（含 `global-error.tsx`） |
| 数据 | Prisma **9** 个 model，**零 enum**（枚举一律 `String` + zod 白名单） |
| 文案 | `lib/i18n.ts` **339** 键，`zh` / `en` / `export type Dict` 三块逐键对称 |
| 设计资产 | `public/design/gallery.html` **65** 条目（喂给 AI 的规范源，与代码同源） |
| 首屏 JS | 共享 chunk **103 kB**（`next build` 输出的首屏共享体积；编译耗时随机器浮动，不写进文档） |

## 技术栈

| 层级 | 技术 |
|---|---|
| 框架 | Next.js `15.5.24`（App Router）+ React `19.2.3` |
| 样式 | Tailwind CSS v4（经 `@tailwindcss/postcss`；**无 `tailwind.config.*`、无 `@theme`**，令牌是 `:root` 自定义属性） |
| 数据 | PostgreSQL（Neon）+ Prisma `6.13`（`@prisma/adapter-pg`，driverAdapters） |
| 认证 | NextAuth `5.0.0-beta.32`（Credentials + JWT）+ bcryptjs |
| 编辑器 | Tiptap 3（StarterKit + 表格 / 任务列表 / 代码高亮 / 颜色 / 链接 / 图片；契约见 `docs/api/tiptap-contract.md`） |
| 媒体 | Vercel Blob + sharp（三级回退：Blob → `public/uploads/` → data URI） |
| 推送 | firebase-admin（FCM，未配置时自动跳过，绝不阻塞发布） |
| 校验 | zod（写接口字段白名单即 schema） |
| 托管 | Vercel |

## 快速开始

```bash
npm install
cp .env.example .env        # 按下表填写
npx prisma db push          # 同步库结构（生成 client 由 postinstall 代跑）
npm run db:seed             # 播种类目 + 默认账户 + Setting 单行
npm run dev                 # http://localhost:3000
```

### 环境变量

| 变量 | 必需 | 说明 |
|---|---|---|
| `DATABASE_URL` | 是 | Neon 连接串（`?sslmode=require`） |
| `AUTH_SECRET` | 是 | NextAuth 5 默认变量名（`NEXTAUTH_SECRET` 为兼容保留） |
| `NEXT_PUBLIC_SITE_URL` | 是 | 站点 Origin 的**唯一真相源**：canonical / OG / RSS / sitemap 只信它，不读请求头 |
| `NEXTAUTH_URL` | 建议 | 站点地址 |
| `BLOB_READ_WRITE_TOKEN` | 用媒体库时 | Vercel Blob 读写 token |
| `AUTH_DEFAULT_PASSWORD` | 仅播种时 | `db:seed` 需要的管理员初始口令。**源码里没有明文兜底**：缺这个变量播种直接中止（连类目都不写库）。首次登录会被强制改密，之后可删掉该变量 |
| `AUTH_DEFAULT_EMAIL` | 否 | 默认管理员邮箱，缺省 `admin@slowlog.dev`（本就是个公开信息，README 里一直写着） |
| `FIREBASE_SERVICE_ACCOUNT` | 否 | 服务账号 JSON 单行字符串；未配置则发布通知自动跳过 |
| `NEXT_PUBLIC_APP_VERSION` | 否 | 页脚版本号，缺省回退 `package.json` 的 version |

```bash
npm run build                       # 生产构建
npm start                           # 起生产服务
npm run lint                        # eslint .
npm run perf                        # build + gzip 体积红线检查
ANALYZE=true npm run build          # 包体积可视化
node scripts/api-tests.mjs <url>    # 六场景集成测试（需先起服务 + 造夹具）
```

## 数据模型（`prisma/schema.prisma`）

| 模型 | 说明 |
|---|---|
| `User` | 账户（邮箱 + bcrypt 哈希 + `role`：`admin` / `reader`） |
| `Category` | 分类（`name`/`nameZh`、`slug`、`description*`、可选封面） |
| `Post` | 文章（双语标题/摘要/SEO 字段、Tiptap JSON 正文、`status`、`tags[]`、`pageConfig`、`featured`、`readTime`、`viewCount`、`publishedAt`） |
| `Note` | 随想（≤500 字，中英成对） |
| `Media` | 媒体（Blob URL + 尺寸 + MIME + alt） |
| `Setting` | 站点设置（单例行 `id="singleton"`，13 字段） |
| `ApiToken` | App 令牌（只存 SHA-256；`scope` = `sync` 90 天 / `admin` 7 天） |
| `AppDevice` | FCM 设备 token |
| `DeletedPost` | 删除墓碑（供 App 增量同步） |

**可见性只有一条规则**：`lib/posts.ts` 的 `publicPostWhere()` = `status==="published"` 且 `publishedAt` 为空或已到点 ⇒ 草稿、归档、未来定时文章从任何公开入口都读不到。

## 关键设计速查表

改代码前先扫这张表；展开版（为什么这么定、踩过什么坑）在 `docs/project-map.md`。

| 规则 | 一句话 | 位置 |
|---|---|---|
| 一条规则 = 一处实现 | 可见性 / 鉴权 / Origin / 设置 / 封面 / 加载壳 / 列表加载 / 归档匹配 / 品牌块 / 输入框 各只有一处实现 | `lib/posts.ts`、`lib/app-auth.ts`、`lib/site-url.ts`、`lib/settings.ts`、`components/CoverArt.tsx`、`lib/admin-fetch.ts`、`lib/archive-match.ts`、`components/SiteBrand.tsx`、`components/ui/Input.tsx` |
| 可见性 | `status==="published"` 且 `publishedAt` 为空或已到点；草稿 / 归档 / 未来定时从任何公开入口读不到 | `lib/posts.ts` `publicPostWhere()` |
| 加载边界作用域 | `loading.tsx` 先冲刷 200 头 → 会 `notFound()` 的详情段**禁止**包，否则真 404 变 soft-404 | `components/LoadingShell.tsx:10-15` |
| 标题模板只有一处 | 各页 `metadata` 只写裸名；中间层 layout **不写 `title`**（浅合并会吃掉根 `template`） | `app/layout.tsx` |
| SEO 权重归一 | `/m` 靠 canonical 指桌面（仍 index）；`/t` 是 canonical + `noindex,follow`；sitemap 只收桌面 | 各树 `page.tsx` 的 `alternates` / `robots` |
| Origin 两条路 | 302 目标必须命中 `ALLOWED_REDIRECT_HOSTS`；SEO 输出只信 `NEXT_PUBLIC_SITE_URL`，不读请求头 | `middleware.ts`、`lib/site-url.ts` |
| 构建期降级 | 只有 `phase-production-build` 吞 DB 异常返回空值，运行期照抛；`getSettings` 是刻意的静默例外 | `lib/posts.ts` `degrade()` |
| 登录防护 | 双维度计数（IP 主闸 + 账号辅）；超阈值走**渐进延迟**而不是硬锁——正确凭据永远能登进去，同一来源 15 分钟内失败满 30 次才硬拒。默认账户判定用环境变量里的初始口令比对哈希，改过密即不再命中 | `lib/auth.ts` |
| 视觉政策 | 直角为身份（`rounded-none` 279 / `rounded-full` 38 只给生命感元素）；阴影只有 `--shadow-card/float/pop`；颜色一律语义令牌 | `app/globals.css`、`docs/design/design-blueprint.md` |
| 触控下限 | 前台与移动后台整页 ≥48px；桌面后台密集控件第二档 ≥36 且间距 ≥4；小图标用 `.hit` 撑命中区 | 蓝图 §十二 |
| 动效四档 | 180 / 220 / 300 / 500ms，`@keyframes` 只住在 globals；跟随类（TOC 250ms 等）刻意不并档 | `app/globals.css` |
| i18n 契约 | 339 键三块对称；**语言是 localStorage 客户端态 ⇒ SSR/curl 永远中文**；加键先按值 grep；英文量词走 `pl()` | `lib/i18n.ts`、`lib/lang-context.tsx` |
| 正文排印 | 17px / 1.9；宽度三档 672 / 768 / 1024（默认 768）；目录侧栏 308px；主线容器 `min(70%,1600px)` | `components/PostClient.tsx` |
| ⚠️ 已知未决 | 站点「默认页配置 · 主题 / 目录开关」对未定制文章无效（三处默认值漂移），后果是夜版进不了文章页 | `lib/page-config.ts:13` + `prisma/schema.prisma:63/119` |

## API 一览

| 方法与路径 | 说明 | 鉴权 |
|---|---|---|
| `GET /api/posts?q=&status=&page=` | 列表（不含 `content` 大字段）。不传 `page` 时按上界截断（游客 60 / 登录 500）并回 `X-Truncated`；传 `page` 时附 `X-Total-Count` | 公开（未登录仅 published） |
| `POST /api/posts` | 新建 | 登录 |
| `GET/PUT/DELETE /api/posts/[id]` | 详情 / 更新 / 删除（id 与 slug 双兼容） | GET 公开 published，其余登录 |
| `POST /api/posts/[id]/view` | 浏览计数（IP + 15 分钟窗口去重） | 公开 |
| `GET/POST /api/categories`、`PUT/DELETE /api/categories/[id]` | 分类 | 读公开，写登录 |
| `GET/POST /api/thoughts`、`PUT/DELETE /api/thoughts/[id]` | 随想（每页 50） | 读公开，写登录 |
| `GET/POST/DELETE /api/media` | 媒体（每页 100；sharp 嗅探真实格式，SVG 禁传） | 登录 |
| `GET/PUT /api/settings` | 站点设置 | 读公开，写登录 |
| `GET /api/search-index` | 全站搜索索引（含拼音双路，正文截断 2000 字） | 公开 |
| `GET /api/covers/[id]` | 服务端渲染封面位图（sharp + 打包字体；已发布走一年 immutable 长缓存） | 公开 |
| `GET /api/health` | 健康检查（未登录只回 `status`） | 公开 |
| `/api/auth/*` | NextAuth：登录 / 改密 / 默认账户探测 | — |
| `POST /api/app/auth/token` | 凭据换 App 令牌（`scope: sync\|admin`，可自助注册为只读） | 凭据 |
| `GET /api/app/sync` | 增量同步（`?since=&pageSize≤200`，含删除墓碑） | Bearer |
| `GET/POST/DELETE /api/app/tokens`、`/api/app/devices` | 令牌与推送设备管理 | 登录或 Bearer |

## 目录结构

```
app/
  (shell)/            首页 / 归档 / 登录 + 全站过场骨架（永不会 404 的列表组）
  posts/[id]/         阅读页 + opengraph-image        tag/[tag]/  标签聚合
  m/  t/              移动端与平板树（含 /m/dashboard 轻后台）
  dashboard/          桌面后台 9 页（服务端壳 + <X>Client.tsx），移动后台另 7 页同构
  api/                19 个 handler                    rss.xml/ sitemap.ts/ robots.ts/ manifest.ts
  error.tsx  global-error.tsx  not-found.tsx  Providers.tsx
components/
  ui/                 12 件基础原语（Input/Panel/AdminTitle/ListError/Badge/Dialog/Toast…）
  editor/             Tiptap 编辑器族 + PostRenderer 阅读渲染器
  dashboard/ mobile/  后台与移动端组件
  CoverArt.tsx  SiteBrand.tsx  LoadingShell.tsx  TabletGate.tsx  DesktopEscape.tsx
lib/
  posts.ts  list-constants.ts  admin-fetch.ts  archive-match.ts   内容、分页上限、后台加载、归档匹配
  auth.ts  auth-config.ts  app-auth.ts  login-shared.ts           凭据校验 / 限流 / 令牌 / 表单共用
  settings.ts  settings-shared.ts  settings-context.tsx           站点设置三级（服务端→类型→上下文）
  i18n.ts  lang-context.ts  relative-time.ts  page-config.ts      文案与本地化、pageConfig 回退
  site-url.ts  schemas.ts  adapt.ts  blob.ts  fcm.ts  prisma.ts   Origin / zod / 三端适配 / 媒体 / 推送
prisma/  schema.prisma  seed.ts
public/design/gallery.html    组件画廊（65 条目，与代码同源的规范镜像）
docs/                         项目地图 · 设计蓝图 · 编辑器契约 · 平板适配
scripts/                      备份/恢复 · 内容导出导入 · API 集成测试
middleware.ts                 /admin 兼容 + 三端分流 + 后台鉴权 + 强制改密
.github/
```

## 文档地图

| 文档 | 管什么 |
|---|---|
| `docs/project-map.md` | **新会话先读这份**：它是什么、五棵树、请求流、数据层、鉴权、`pageConfig`、设计系统、一处实现与加载边界、坑位速查 |
| `docs/design/design-blueprint.md` | 设计蓝图：暖纸四层、字级节奏、封面契约、状态与可达性、后台与工具页 |
| `docs/api/tiptap-contract.md` | 编辑器与渲染器的 JSON 文档契约 |
| `docs/design/tablet-adaptation.md` · `docs/compose/spec/*` | 平板适配与 App 侧规范 |
| `public/design/gallery.html` | 组件画廊（可复制提示词的规范源） |
| `CHANGELOG.md` | 变更历史 |

## 许可

本项目以 **GPL-3.0** 开源（copyleft）：可自由使用、学习、修改与再分发，衍生作品须同样以 GPL-3.0 发布并保留版权声明。全文见 [`LICENSE`](./LICENSE)。文章内容的许可见站点页脚与阅读页（CC BY-NC-SA 4.0）。

---

*Built with Next.js, Tailwind CSS, and lots of ☕*
