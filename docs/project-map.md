# 项目地图 · 慢日志 / SlowLog

> 给"刚打开这个仓库的会话"看的入门图：它是什么、请求怎么流、规则写在哪、哪儿有坑。
> **测量基准**：`origin/main = 2b29bea`（v0.5.5）+ `chore/remote-cleanup` 已并入；工作区另有注释与文档改动未提交时以 `git status` 为准。
> 数字全部现测于 2026-10-01，不抄旧文档。

## 按目的跳转

| 你要做的事 | 看哪节 | 通常还要看 |
|---|---|---|
| 跑起来 / 部署 | `README.md` 快速开始 | 本文 §六 鉴权与凭据 |
| 改一个页面 / 加路由 | §三 五棵树、§四 请求流 | §九 一处实现与加载边界 |
| 改 UI / 令牌 / 文案 | §二 v0.5.5 硬规、§八 设计系统 | `docs/design/design-blueprint.md`、画廊 |
| 查数据为什么读不到 / 缓存不生效 | §五 数据层 | §九 一处实现与加载边界 |
| 动后台或登录链路 | §六 鉴权与凭据 | §九 一处实现与加载边界 |
| 想知道哪里还是坑 | §十 坑位速查 | — |

图例：⚠️ 会咬人（不知道就写错代码）｜✅ 已收口（照现有实现复用，别另起）｜🕐 待作者定（别擅自动）。

---

## 一、它是什么

个人技术博客，设计语言「暖纸 + 直角 + mono 小标」。一套 Next.js 代码同时服务**五棵树**（桌面 / 移动 / 平板 / 桌面后台 / 移动后台）+ 一个 Android App 的配套接口。

| 件 | 版本 / 事实 | 备注 |
|---|---|---|
| Next.js | `15.5.24`（App Router，实测安装版） | ⚠️ `AGENTS.md` 里"这不是你所知的 Next.js / 去读 `node_modules/next/dist/docs`"是**假信号**：该目录不存在，这是 stock 版本 |
| React | `19.2.3` | |
| Tailwind | `v4`，经 `@tailwindcss/postcss` | **没有 `tailwind.config.*`，也没有 `@theme` 块**；token 全是 `:root` 自定义属性 |
| 数据 | Prisma `6.13` + `@prisma/adapter-pg`（Neon） | 生成到 `lib/generated/prisma`（gitignore），`previewFeatures=["driverAdapters"]` |
| 鉴权 | NextAuth `5.0.0-beta.32`（Credentials + JWT） | |
| 正文 | Tiptap 3（JSON 存库，中英共用一份 `content`） | |
| 图片 | Vercel Blob + sharp | 三级回退：Blob → `public/uploads/` → data URI |
| 推送 | firebase-admin（FCM） | 失败只记日志，绝不阻塞发布 |

**规模**：源码 ts/tsx **206**（`app`/`components`/`lib`，不含生成物）；`page.tsx` **30**、`layout.tsx` **3**、`loading.tsx` **18**、error 边界 **3**、`app/api/**/route.ts` **19** + `app/rss.xml/route.ts`；`components/ui/` 原语 **12** 件；字典 **339** 键 × 三块；组件画廊 **65** 条目。跟踪文件数：合并 `chore/remote-cleanup` 前 **341**，之后 **293**。

---

## 二、v0.5.5 定下的视觉硬规（新会话最容易踩回去的地方）

- **阴影只有三个令牌**：`--shadow-card`（卡片）/ `--shadow-float`（浮层、回顶、灯箱）/ `--shadow-pop`（弹出菜单、Toast、开关钮）。源码里 `shadow-sm|md|lg|xl|2xl` 与 `shadow-[0_...]` 已清零。
- **直角是身份**：`rounded-none` 279 处；`rounded-full` 38 处**只留给生命感元素**（品牌 S 章标、头像、封面圆点、hero 指示点）。编辑器 FloatingMenu 的残留 `rounded` 已压平。
- **颜色不许裸写**：`text-white` / `bg-white` / `border-white` / `text-zinc-*` 在 tsx 里 **0 处**，一律走 `--yh-*` / `--dash-*`。
  ⇒ 过去那条"看类名猜夜版必错"的警告**已换成新前提**：`.dark [class~=...]` 反相桥（`globals.css` 里 33 条）现在只是**兜底层**，防止有人再写回裸类；读源码时不该再指望它替你翻译。
- **Toast**：容器 `role="status" aria-live="polite"`，错误型再挂 `role="alert"`；卸载时清定时器（此前会泄漏后继续 setState）。
- **暗色下的分隔符**要用 `--yh-muted` 这类语义色，不能用近白灰（v0.5.5 修的就是面包屑 `/` 在夜里看不见）。

---

## 三、五棵树

| 树 | 页数 | 路由 | 特征 |
|---|---|---|---|
| 桌面公开 | 6 | `/`、`/archive`、`/login`、`/posts/[id]`、`/tag/[tag]`、`/privacy` | 权重主体；JSON-LD 与 OG image 只在这里 |
| 移动 `/m` | 5 | `/m`、`/m/archive`、`/m/login`、`/m/posts/[id]`、`/m/change-password` | canonical 指桌面，**仍 index**；归档一次载入全量不分页 |
| 平板 `/t` | 3 | `/t`、`/t/archive`、`/t/posts/[id]` | canonical 指桌面 **且** `noindex,follow`；无 login 页 |
| 桌面后台 | 9 | `/dashboard` + 7 子页 + `/dashboard/posts/[id]`（编辑器，`"new"`=新建） | layout 级 noindex |
| 移动后台 | 7 | `/m/dashboard` + posts/notes/categories/tokens/settings/more | 底栏 5 Tab |

**壳 + Client**：13 个客户端页拆成"服务端壳 `page.tsx` 只出 `metadata` + `<X>Client.tsx`"，浏览器标签页才叫得出每页名字。两条相关硬规：① 中间层 layout **不写 `title`**（metadata 逐层浅合并，写了会把根的 `{default, template}` 整块替换掉）；② 标题模板只有一处 —— `app/layout.tsx` 的 `template: "%s | ${siteName}"`，各页只写裸名。

---

## 四、一个请求进来后（`middleware.ts`，155 行，顺序即优先级）

1. `/admin*` → 302 到 `/dashboard*`（旧别名）。
2. **手机 UA rewrite 进 `/m`**（`/Android.*Mobile|iPhone|iPod|Windows Phone/i`）；已在 `/m`、`/api`、`/dashboard` 或 cookie `view=desktop` 时跳过。平板 UA 故意不进移动版。
3. **平板 rewrite 进 `/t`**（`/iPad|Tablet|Android(?!.*Mobile)/i` 或 `view=tablet`；`view=desktop` 一票否决）。iPadOS 伪装 macOS 的兜底是客户端 `components/TabletGate.tsx`（视口 768–1366 + 粗指针 + 无 view 偏好）。
4. **登录门**：未登录 `/dashboard*` → `/login`；`/m/dashboard*`、`/m/change-password` → `/m/login`。
5. **角色门**：`role === "reader"` 被挡在 `/m` 或 `/`。⚠️ 这里**内联**判 role，不 import `lib/app-auth`（那模块带 prisma/pg，进 edge 打包链直接构建失败）；缺 role 时按作者放行，避免一次部署把本人锁门外。
6. **强制改密门**：`needsPasswordChange` → 对应改密页。

**两条 host 路径不要混**：302 用 `x-forwarded-host`/`host` 但必须命中 `ALLOWED_REDIRECT_HOSTS`，否则回落；canonical / RSS / sitemap / OG 一律走 `lib/site-url.ts`（只信 `NEXT_PUBLIC_SITE_URL`）。理由写在头注：伪造 Host 会把 SEO 与订阅器指向攻击者域名。

---

## 五、数据层（`prisma/schema.prisma` 9 个 model，**零 enum**）

`User` / `Category` / `Post` / `Note`（随想）/ `Media` / `Setting`（单例行 `id="singleton"`）/ `ApiToken` / `AppDevice` / `DeletedPost`（同步墓碑）。

- **双语成对**：`title/titleZh`、`excerpt/excerptZh`、`seoTitle/seoTitleZh`、`seoDescription/seoDescriptionZh`、Note 的 `content/contentZh`、Category 的 `name/nameZh`。**`Post.content` 只有一份** ⇒ `mapPost` 里 `headingsZh` 是 `headings` 的别名，注释写明"若将来有 contentZh 必须重算"。
- **enum 一律 `String` + 应用层校验**（`Post.status`、`User.role`、`ApiToken.scope`、`Setting.theme`），写接口白名单在 `lib/schemas.ts`（zod）。
- **可见性只有一条规则**：`lib/posts.ts:98/103` 的 `isPublicPost` / `publicPostWhere` = `status==="published"` **且** `publishedAt` 为空或已到点 ⇒ 草稿、归档、未来定时从任何公开入口都读不到；详情另有 `scheduledGuard`。
- **缓存**：`getCachedPostRows` / `getCachedPostPage` / `getSettings` 全是 `unstable_cache` + `revalidate: 60` + tag；后台概览 30s。发布后统一 `revalidatePostPaths()`（tag + `/` + rss + sitemap + **三棵树的 `[id]`**，注释记录过旧实现漏了 `/m`、`/t`）。
- **`degrade(fn, fallback, ctx)`**：只在 `NEXT_PHASE === "phase-production-build"` 吞 DB 异常返回空值，运行期照抛。CI 的 `build` job **故意不给 `DATABASE_URL`** 来验证这条。已确认保持，不要改回"运行期静默返回空列表"。⚠️ 例外：`getSettings` 走的是自己的 try/catch 静默降级（设置属装饰性数据，与内容查询策略刻意不同）。
- **`stripPostHeavy`** 从列表载荷剥掉 `content*/html*/markdown*/headings*/pageConfig` ⇒ 阅读页必须把**原始 Prisma 行**传进 `PostClient` 才能解析主题。
- **上限**：前台列表 `FRONT_LIST_LIMIT = 100`（`lib/posts.ts:195`，超出只 warn 一次）、单页 `FRONT_PAGE_SIZE_MAX = 20`、首页分组 `HOME_GROUP_LIMIT = 8`。后两个住在 `lib/list-constants.ts` —— 该文件单独存在是因为客户端组件不能 import `lib/posts.ts`（里面有 `revalidateTag`）。

---

## 六、鉴权与凭据（v0.5.5 之后有变，读这段别再翻源码猜）

| 主题 | 规则 | 位置 |
|---|---|---|
| Web 会话 | `auth-config.ts`（edge 安全，`providers: []`，JWT，`pages.signIn="/login"`）+ `auth.ts`（Node runtime 才挂 Credentials）。⚠️ JWT 只在**签发那一刻**写入 `id/role/needsPasswordChange` ⇒ 改了某账号 role 不会让已签发会话立刻变权限 | `lib/auth-config.ts`、`lib/auth.ts` |
| 口令校验与限流 | ✅ 只有 `verifyCredentials` 一份。IP 延迟阈值 10、**硬拒 30**、账号阈值 5、窗口 15 分钟、指数退避封顶 3000ms；**退避只在确认失败之后睡**（旧的"先睡再查"会让正确密码也罚等，作者投诉过）。计数器是进程内有界 `Map`（2000 条 / 半量淘汰）；⚠️ serverless 下按实例生效 | `lib/auth.ts` |
| 登录表单 | `normalizeLoginEmail` 先归一（只填前缀补 `@slowlog.dev`）再算限流 key；成功用 `location.assign` 整页跳转（后台首屏是多个 DB 查询串起来的 RSC，`router.push` 期间只有"登录中…"没有浏览器进度）；两个字段已补 `id`/`name`/`htmlFor`/`autoComplete` | `lib/login-shared.ts`、`app/(shell)/login/LoginForm.tsx`、`components/mobile/MLogin.tsx` |
| 默认管理员 | 邮箱 `admin@slowlog.dev`（`AUTH_DEFAULT_EMAIL` 可覆盖，本就是公开信息）；**初始口令不进仓库** —— `prisma/seed.ts` 缺 `AUTH_DEFAULT_PASSWORD` 直接 `exit 1`（实测：不给 env 时连类目都不写库）。"是否仍是默认账户"改为**用 env 初始口令比对 bcrypt 哈希** ⇒ 改过密自然不再命中，无需新增列、不会强制改密循环。CI 已配假值 | `prisma/seed.ts`、`lib/auth.ts` |
| App 侧 | 同一份 `verifyCredentials` 换发长期 Bearer（只存 SHA-256，明文仅返回一次）。scope：`sync` 90 天（只读，可自助注册成 `reader`）、`admin` 7 天（写，要求账号本身是 admin）。网关 `requireSessionOrBearer` / `requireAdminAuth`；`missing\|invalid\|expired→401`、`scope\|role→403`。改密成功会撤销全部未撤销 token | `lib/app-auth.ts`、`app/api/app/**` |
| 写接口 | 一律先 `passwordChangeRequired(gate.session)` 挡 403 —— 未改默认密者不能写 | 各 `app/api/**/route.ts` |

---

## 七、站点设置与 `pageConfig`

- 单行 `Setting`；服务端 `getSettings()`（带 tag 缓存），客户端 `useSiteSettings()`（`lib/settings-context.tsx`）。`lib/settings-shared.ts` 只放类型与默认值，免得把 prisma 拖进客户端 bundle。
- 写接口字段白名单**就是 zod**（`settingsSchema`）；可空字段必须 `.nullable()`（只 `optional` 会把 `null` 判成 400）。
- 每篇文章可带 `pageConfig`（布局/主题/主色/字体/宽度/目录）；未定制字段回落站点「默认页配置」：`withSiteDefaults(post, site)`（`lib/page-config.ts`）逐字段比较，判据是 `UNSET_PAGE_CONFIG` —— 它与 `prisma/schema.prisma` 里 `Post.pageConfig` 的列默认必须完全一致，改列默认就要同步改它。
- ⚠️ **三处默认值漂移已修（2026-10-02，按零迁移方案）**：判据原先拿 `DEFAULT_PAGE_CONFIG`（`theme=system`/`showTOC=true`）去比，而未定制文章实际带的是列默认（`theme=light`/`showTOC=false`）⇒ 站点夜版与「显示目录」对全部未定制文章失效，`PostClient` 每篇都挂 `sl-force-light`。现 `DEFAULT_PAGE_CONFIG` 只兜「值不合法」。代价：作者显式选成与列默认完全相同的那组值（light + 不显示目录）会被当成未定制、由站点默认接管——要彻底区分得把存储改成「字段缺失才算未设置」，需动库结构与回填。

---

## 八、设计系统

| 件 | 现值 / 规则 | 位置 |
|---|---|---|
| 令牌声明点 | `:root` 基础（含 `--radius-sm/md/lg`、`--shadow-card/pop/float`）→ `:root` 第二段（动效 + 危险五档 + 语义三色）→ `.dark` 整组夜值 → `.sl-force-light`；**第五份内联副本**在根 layout 的 critical CSS（只含基础色，故有 `.css-probe` 探针判断样式是否已加载） | `app/globals.css:9/111/1239/1348`、`app/layout.tsx:127/141` |
| 两族令牌 | `--yh-*` 前台、`--dash-*` 后台；危险五档 `danger/-strong/-soft/-border/-fg`（`-fg` 是实心钮文字色，夜版必须翻深，否则白字压暗红 2.97:1）；语义三色 `ok/warn/info` × 三档 ⇒ 组件里不再出现色相名 | `app/globals.css` |
| ⚠️ 反相桥 | `.dark [class~=...]` 33 条会把裸 `text-zinc-*`/`bg-white` 重映射 —— 但源码里这类裸类**已清零**，它现在只是"有人写回来时兜底"。别拿它当翻译器去猜夜版色 | `app/globals.css` 末尾 |
| 动效四档 | `--duration-fast 180 / exit 220 / normal 300 / slow 500`；`@keyframes` 只住在 globals，组件禁止内联 `<style>`；跟随类（TOC 250、抽屉 160、进度轨 120、取色器 100）刻意不并档 | `app/globals.css`、蓝图 §十二 |
| 直角与圆角 | `rounded-none` 279 处为身份；`rounded-full` 38 处只留给生命感元素（品牌章标 / 头像 / 封面圆点 / hero 指示点） | 全站 |
| `components/ui/` 12 件 | `Input`（`inputCls(size,tone,extra)`）、`Panel`（`PANEL_CLS`+`BrandMark`）、`AdminTitle`、`ListError`、`Badge`、`Button`、`Dialog`、`FormField`、`DropdownSelect`、`Toast`、`Toggle`、`Collapsible`。⚠️ `EmptyState` 与 `Pagination` 在 `components/` 根，不在 `ui/` | `components/ui/` |
| 品牌块 | ✅ `components/SiteBrand.tsx` 一处实现（站名/Logo 取站点设置、品牌永不断字、拉丁副名 `<md` 让位）；`MHeader`/`MFooter` 只共用字符串来源不共用组件 | `components/SiteBrand.tsx` |
| 归档匹配 | ✅ `lib/archive-match.ts`：`postMatchesQuery`（五路含摘要、category 对象/字符串双吃）、`filterYearsByQuery`、`countYears`，与 `lib/posts.ts` 那段 SQL 同口径 —— **改字段两处一起改** | `lib/archive-match.ts` |
| i18n | 339 键 × 三块逐键对称；语言是 `localStorage("yh-lang")` 纯客户端态 ⇒ **SSR/curl 永远中文**；英文量词走 `pl(n,word,plural?)`；加新键**先按值 grep**（有上百个"已声明未消费"键，同一句话曾有 3 把） | `lib/i18n.ts`、`lib/lang-context.tsx` |
| 封面 | `hash(标题+分类+id+标签)` → 版式 / 角标 / 形态；纸色由分类家族定，编号 `No.XXXX` 由 slug 派生 | `components/CoverArt.tsx`、`lib/cover-{derive,fonts,svg}.ts` |
| 组件画廊 | 65 条目，**是喂给 AI 的规范源**：令牌块与描述必须跟代码一致，写错会被当规矩生回去 | `public/design/gallery.html` |

---

## 九、一处实现与加载边界

- **一条规则 = 一处实现**：可见性 `lib/posts.ts`、鉴权 `lib/app-auth.ts`、origin `lib/site-url.ts`、设置 `lib/settings.ts`、封面 `CoverArt.tsx`、加载壳 `LoadingShell`/`DashLoading`、后台列表加载 `lib/admin-fetch.ts`（`loadList`/`loadObject` 永不 reject，失败一律渲染 `ListError`）、归档匹配 `lib/archive-match.ts`、品牌 `SiteBrand.tsx`。
- **`loading.tsx` 作用域纪律**（权威注释 `components/LoadingShell.tsx:10-15`）：它是流式 Suspense 边界，会**先冲刷 200 状态头**，只允许出现在 `(shell)` 列表组；会 `notFound()` 的详情段刻意不加，否则真 404 变 soft-404。⚠️ 现有一处自相矛盾：`app/dashboard/posts/[id]/page.tsx` 会 `notFound()`，却被 `dashboard/loading.tsx` 与 `dashboard/posts/loading.tsx` 两层包住（父段边界对后代生效）—— 只因整棵后台 noindex 才没造成 SEO 后果。

---

## 十、坑位速查（都是实测，不是猜测）

| 状态 | 现象 | 真因 | 位置 |
|---|---|---|---|
| ✅ 已收口 | 子页标题全是"仪表盘 \| 慢日志" | 中间层 layout 写了 `title`，浅合并吃掉根 template | `app/dashboard/layout.tsx` |
| ✅ 已收口 | `/login` 首屏没有 `<form>` | 预渲染 + `useSearchParams()` 的 `Suspense fallback={null}` | `app/(shell)/login/page.tsx`（现 `force-dynamic`） |
| ✅ 已收口 | 后台"骨架屏转到天荒地老" | 加载失败没有错误态（不判 `r.ok`、无 catch） | `lib/admin-fetch.ts` + `components/ui/ListError.tsx` |
| ✅ 已收口 | 搜一个只命中摘要的词，时间线崩 | 服务端五路命中 vs 客户端窄规则，且 `p.category` 是对象 | `lib/archive-match.ts` |
| 🕐 待作者定 | 站点主题/目录开关对文章无效 | 三处默认值漂移（schema vs JS vs SETTINGS_DEFAULTS） | `lib/page-config.ts:13` + `prisma/schema.prisma:63/119` |
| 🕐 待作者定 | 夜版看着没生效 | `.sl-force-light` 本地重声明浅色板（上一条的直接后果） | `app/globals.css:1348` |
| ⚠️ 测量约束 | 英文页在 curl 里永远中文 | 语言是 `localStorage` 客户端态 | `lib/lang-context.tsx` |
| ✅ 设计如此 | `npm run db:seed` 突然中止 | 缺 `AUTH_DEFAULT_PASSWORD`（源码已无明文兜底） | `prisma/seed.ts` 开头守卫 |
| ⚠️ 未修 | 后台编辑器 404 是 soft-404 | 会 `notFound()` 的段被两层 `loading.tsx` 包住 | `app/dashboard/loading.tsx`、`app/dashboard/posts/loading.tsx` |
| ⚠️ 未修 | 平板树三处不对称 | `/t/posts/[id]` 无 `generateStaticParams`、无 JSON-LD/OG；`/t` 无 login；`/m/posts/[id]` 不认 `raw.canonicalUrl` | `app/t/**`、`app/m/posts/[id]/page.tsx` |
| ⚠️ 测量约束 | 以为 `.next` 是新的 | `next start` 只认**启动那一刻**载入内存的构建；改完要重 build 并另起临时口复验 | 本机现场约束 |

---


## 附、文档地图

| 文档 | 管什么 | 什么时候读 |
|---|---|---|
| `README.md` | 门面 + 速查表 + 环境变量 + API 表 | 第一次接触仓库 |
| **本文** | 架构、规则、坑位 | 动手改之前 |
| `docs/design/design-blueprint.md` | 设计数值与视觉契约的权威版 | 改 UI / 令牌 / 排印 |
| `docs/api/tiptap-contract.md` | 编辑器与渲染器的 JSON 文档契约 | 改编辑器或正文渲染 |
| `CHANGELOG.md` | 变更历史（Keep a Changelog + semver） | 想知道"什么时候变成这样的" |
| `public/design/gallery.html` | 65 条目组件画廊（可复制提示词的规范源） | 新建组件前对齐口径 |
| `spark-output/`（本地，不入库） | 审计笔记、改前改后对照稿 | 复盘历史决策 |
