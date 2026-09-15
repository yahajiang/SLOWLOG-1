# SlowLog 慢日志 · 独立复核审查报告

> **审查日期**：2026-09-15（第二轮 · 独立复核）
> **代码基线**：`55861cc`（`fix: 全量审查修复 49 项`）+ `3e391ca`（许可/蓝图）
> **工作树状态**：干净（`git status` 空）
> **本轮定位**：**不复述**上一轮结论，只做两件事 —— ① 独立验证上一轮修复是否真实落地；② 审计上一轮**明确未覆盖**的盲区与新增风险面。
> **对标基线**：`docs/full-review-2026-09-15.md`（上一轮 49 项已闭环报告）

---

## 一、执行摘要

### 一句话结论

**代码质量确实达到了报告声称的水位** —— 我独立复跑了类型检查（0 错误）并逐项比对源码，上一轮 P0/P1 修复**全部真实落地**，未发现"报告说修了、代码没改"的情况。
**但工程外围存在 3 个新的、上一轮盲区里的实质问题**，其中 **1 个是数据泄漏隐患（发布脚本已过期且危险）**，另 2 个是文档与接口契约的漂移。

### 复核评分

| 维度 | 上一轮自评 | 本轮独立复核 |
|---|---|---|
| 类型安全 | ★★★★★ | ★★★★★ **复现一致**（`tsc --noEmit` 14s / EXIT 0） |
| 安全基线（应用层） | ★★★★☆ | ★★★★☆ **复现一致**（逐项抽验 15 处修复均在位） |
| 发布/运维安全 | 未评估 | ★★☆☆☆ **新发现缺陷**（见 N-1） |
| 文档准确性 | 未评估 | ★★☆☆☆ **drift 明显**（见 N-2） |
| 接口契约一致性 | ★★★☆☆ | ★★★☆☆ **仍有 2 处漏网**（见 N-3 / N-4） |
| 工程门禁 | 未评估 | ★★★☆☆ **无 lint 门禁**（见 N-5） |

### 问题分布（本轮新增）

| 级别 | 数量 | 摘要 |
|---|---|---|
| **P1 严重** | **1** | N-1 `scripts/publish-both.mjs` 会重新泄漏 `content-export/` |
| **P2 一般** | **3** | N-2 README 事实脱节 · N-3 分类 POST 丢字段且无错误处理 · N-4 列表接口无上界 |
| **P3 改进** | **3** | N-5 无 lint 门禁 · N-6 依赖/仓库卫生 · N-7 移动端改密被踢到桌面页 |

---

## 二、独立验证：上一轮修复的真实性

### 2.1 可复现的自动化检查

| 检查 | 命令 | 结果 |
|---|---|---|
| TypeScript 全量类型检查 | `npx tsc --noEmit` | **EXIT 0 / 0 错误 0 警告**（14s）— 与报告一致 ✅ |
| 依赖漏洞审计 | `npm audit` | **critical 0** · high 5 · moderate 1 · total 6 |
| 依赖树版本一致性 | `package.json` | `next ^15.5.24` 与已安装一致 ✅（但见 N-6） |

**关于 5 个 high**：分布于 `@prisma/config` / `deepmerge-ts` / `effect` / `prisma` / `postcss`，**全部为构建期工具链依赖**（Prisma CLI、PostCSS/Tailwind 编译链），不进入运行时产物。`ci.yml` 的门禁刻意设在 `--audit-level=critical` 并写明了收紧条件，**这是有意识的取舍而非疏漏**，本轮认同该判断。

### 2.2 逐项源码抽验（15 项，全部在位）

| 上一轮编号 | 声称的修复 | 本轮源码验证 | 判定 |
|---|---|---|---|
| P0-1 | 新增 `lib/slug.ts`，中文转拼音 + 时间戳兜底 | `lib/slug.ts` 存在，`slugify()` 纯同步 / `slugFromTitle()` 动态 `import("pinyin-pro")`；`lib/schemas.ts:15-18` 正则已收紧为 `^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$` | ✅ 在位 |
| P1-1 | 媒体一律以 sharp 探测的真实格式判定 | `lib/blob.ts:97-106` 先 `sharp(buffer,{animated:true}).metadata()`，不支持即抛 `INVALID_IMAGE_ERROR`；GIF 分支在**通过校验之后**才原样透传 | ✅ 在位 |
| P1-5 | 文件名消毒 + 批量上传回滚 | `lib/blob.ts:25-37` `sanitizeFilename()` 保留中文/扩展名、去 `..`；`app/api/media/route.ts:43-92` 两阶段提交 + 失败回滚 Blob 与 DB | ✅ 在位 |
| P1-3 | RSS CDATA 转义 | 新增 `lib/xml.ts`，`cdata()` 走 `]]]]><![CDATA[>` 拆分 | ✅ 在位 |
| P1-4 | JSON-LD 转义 | `lib/adapt.ts:132-137` `safeJsonLd()`（`<`/`>`/`&` → `\u003c` 等） | ✅ 在位 |
| P1-6 | 统一 `degrade()` 降级 | `lib/posts.ts:123-136`，构建期降级 / 运行期上抛，5 个查询统一包裹 | ✅ 在位 |
| P1-2 | 登录限流双维度 + 渐进退避 | `lib/auth.ts:23-79` IP+email 双计数、`applyBackoff()` 指数退避上限 3s、表容量 2000 + 批量淘汰最旧一半 | ✅ 在位 |
| P2-6 | `/api/settings` GET 无写副作用 + 缓存头 | `app/api/settings/route.ts:36-47` 未命中返回只读默认值，带 `s-maxage=60` | ✅ 在位 |
| P2-7 | `/api/categories` GET 统一错误契约 | `app/api/categories/route.ts:23-33` 已有 try/catch → `apiError(500,…)` | ✅ 在位 |
| P3-1 | CSP 响应头 | `next.config.mjs:39-62` 含 `object-src 'none'` / `base-uri 'self'` / `frame-ancestors 'none'` / `connect-src 'self'` | ✅ 在位 |
| P3-2 | health 只对管理员暴露诊断 | `app/api/health/route.ts:29-41` 匿名仅 `{status}` | ✅ 在位 |
| P3-11 | 分类计数只统计已发布 | `app/api/categories/route.ts:15` `_count.posts.where: publicPostWhere()` | ✅ 在位 |
| P3-12 | 搜索词转义 LIKE 元字符 | `app/api/posts/route.ts:33` `[\ % _]` 转义 | ✅ 在位 |
| P3-19 | 重定向 host 白名单 | `middleware.ts:41-64` `allowedRedirectHosts()` + `ALLOWED_REDIRECT_HOSTS` | ✅ 在位 |
| P3-20 | 浏览计数优先取平台头 + 表容量上限 | `app/api/posts/[id]/view/route.ts:18-49` `x-vercel-forwarded-for → cf-connecting-ip → x-real-ip → xff`，`MAX_VIEW_ENTRIES = 5000` 批量淘汰 | ✅ 在位 |

**结论**：上一轮报告的修复可验证、可复现，**不存在"报告式修复"**。这份报告可以信任。

### 2.3 本轮排除的疑似问题（避免误报）

| 疑似 | 排查结论 |
|---|---|
| `getCachedThoughts(page)` 的 `unstable_cache` 键为静态 `["thoughts-all"]`，翻页会串数据？ | **不是缺陷**。读 `node_modules/next/dist/server/web/spec-extension/unstable-cache.js:36+`，源码注释明确："The invocation key will **combine the fixed key with the arguments** when actually called" —— 参数已并入缓存键。 |
| `lib/posts.ts:180 headingsZh: headings` 中英目录同源 | 已在源码内写明为**已知并有意保留**（正文未做双语分离），附有未来改造约束注释，非缺陷。 |
| `middleware.ts` 的 `redirectFor` 读 `x-forwarded-host` | 已被 P3-19 的白名单收口，且与 `lib/site-url.ts` 的"只信任 env"策略**分工明确**（前者用于运行时跳转、后者用于 SEO 输出），属合理设计。 |

---

## 三、本轮新增发现

---

### 🔴 N-1 `scripts/publish-both.mjs` 是一枚已过期的地雷：运行它会重新公开 8 篇 `content-export` 文章

| 项 | 内容 |
|---|---|
| **定位** | `scripts/publish-both.mjs:11`（STRIP）、`:65`（merge）、`:14`（禁用代理）、`:77-79`（假自检） |
| **类型** | 数据泄漏 / 发布流程失配 |
| **严重度** | **P1** —— 与 2026-09-13 的公开仓泄漏事故**同一条路径** |
| **触发** | 任何人（含未来的我）执行 `node scripts/publish-both.mjs` |

**四处失配，逐条证据**

```js
// :11  STRIP 少了 content-export —— 而 content-export/ 在私有仓是被 force-add 跟踪的
const STRIP = ["cookies2.txt", "public/uploads", "backups"];
//             ↑ 缺 "content-export"

// :56  按该 STRIP 做 filter-repo，于是 content-export 被原样保留
execSync(`"${PY}" -m git_filter_repo --invert-paths ${STRIP.map(p=>`--path ${p}`).join(" ")} --force`, …)

// :77-79  终检复用同一个 STRIP → "零残留"自检必然通过（假阴性）
const leaked = …filter((f) => STRIP.some((p) => f.startsWith(p)));

// :65  用 merge 方式同步 —— 这正是被明令废止的旧流程
git("merge -X ours slowlog1/main -m \"merge: 并入远程 README 蓝图与 LICENSE\"", …)

// :14  禁用代理 —— 该写法在当前网络已失效（会 21s 超时）
const GIT = ["-c", "http.proxy=", "-c", "https.proxy="];
```

**实测佐证（git 跟踪状态）**

```
$ git ls-files content-export | wc -l
8                      ← 8 个导出文章在私有仓被跟踪（.gitignore 第 41 行无效）
$ git ls-files backups
backups/backup-2026-09-07-05-56.json
```

`lib/posts.ts` 之外，`public/uploads/*.webp` 亦有 1 个被跟踪条目。也就是说：**该脚本若运行，会把 8 篇文章 + 1 张上传图 + 1 份含用户 email/name 的备份 JSON 一并推到公开仓库**，而脚本自己的残留检查会报"✓ 零残留"。

**影响**：2026-09-13 那次泄漏的**完全复刻**。且因为自检会假通过，操作者不会察觉。

**建议（二选一，推荐 A）**

**A. 直接删除该脚本**（推荐）
现行发布流程已成熟且记录在案（临时克隆 → filter-repo 含 `content-export` → 全历史扫描 → 强推 → API 交叉核验），这个脚本是旧流程的残留物，**保留的收益为负**。

**B. 若坚持保留**，必须同时修四处：
```js
const STRIP = ["cookies2.txt", "public/uploads", "backups", "content-export"];
const GIT   = [];                                  // 去掉禁用代理
// 去掉 :65 的 merge，改为 --force-with-lease 强推清洗后的 HEAD
// 终检改为独立列表：const FORBIDDEN = [...STRIP, ".env"]，且对全历史扫描（git log --all --name-only）
```

**另附**：`.gitignore` 第 37/41 行已列出 `backups/` 与 `content-export/`，但它们被 `git add -f` 跟踪，**gitignore 对已跟踪文件无效**——这正是事故根因，建议在 `.gitignore` 该处补一行注释说明"这两个目录在私有仓刻意 force-add，公开仓必须用 filter-repo 剔除"，以免后来者误判。

---

### 🟠 N-2 README 与代码事实脱节 4 处以上

| 项 | 内容 |
|---|---|
| **定位** | `README.md:8`、`:21`、`:28`、`:53`、`:131`、`:157`、`:167`、`:110-140`（结构树） |
| **类型** | 文档漂移 |

| README 声称 | 代码事实 | 证据 |
|---|---|---|
| 「平板默认走桌面」「平板走桌面」 | **平板有独立三端树 `/t`**，middleware 主动 rewrite | `middleware.ts:21-28` `TABLET_UA_RE` → `/t`；`app/t/page.tsx`、`app/t/archive/page.tsx`、`app/t/posts/[id]/page.tsx` 三个文件实际存在 |
| 「`lib/i18n.ts` **161 条** zh/en 1:1 字典」（出现 2 次） | **实际 270 条** | 解析 `export type Dict` → 270 个键 |
| 「Next.js **15.4** (App Router)」 | **实际 15.5.24** | `package.json:49` `"next": "^15.5.24"` |
| 「**36 页**静态化」 | **43 路由 / 25 页静态化** | 上一轮报告 4.2 节构建产物实测 |

**另有两处覆盖缺口**
- **路由清单缺 `/t` 全家**：README 只写了 `/m/*`，完全没提平板树；
- **API 表缺 3 个已存在的路由**：`GET /api/search-index`、`GET /api/health`、`POST /api/posts/[id]/view`；
- **结构树缺**：`app/tag/[tag]/`、`app/t/`、`lib/adapt.ts`、`lib/slug.ts`、`lib/xml.ts`、`lib/schemas.ts`、`docs/`、`.github/workflows/`。

**影响**：README 是公开仓的门面（公仓 README 直接就是本文档的姊妹版），且是接手者唯一的地图。平板树这个**完整功能模块**在文档里不存在，属于会让新读者漏读整条链路的缺口。

---

### 🟠 N-3 分类创建接口：静默丢弃 `descriptionZh`，且无错误处理

| 项 | 内容 |
|---|---|
| **定位** | `app/api/categories/route.ts:35-45`（POST） |
| **类型** | 数据丢失 / 契约不一致 |

**问题 1：字段被吞**

```ts
// lib/schemas.ts:90  schema 明确接受
const categoryCreateSchema = z.object({ …, descriptionZh: z.string().max(300).optional() })

// app/api/categories/route.ts:42  但 create 的 data 里没有它
const cat = await prisma.category.create({ data: {
  name: body.name, nameZh: body.nameZh, slug: body.slug,
  description: body.description, coverImageUrl: body.coverImageUrl,
  // ← descriptionZh 缺失：通过了 zod 校验，然后被静默丢弃
} })
```

对照 `app/api/categories/[id]/route.ts:8` 的 `ALLOWED_FIELDS` **包含** `descriptionZh` —— 即"新建时存的英文描述永远存不进去，但编辑时可以改"。这是一个只有先建后改才能发现的隐蔽不一致。

**问题 2：唯一约束冲突返回框架级 500**

POST 整段**没有 try/catch**（PUT/DELETE 都有）。`slug` 在 `prisma/schema.prisma:28` 是 `@unique`，重复创建抛 `P2002` → 未捕获 → Next 返回框架 500 响应，而全站其余写接口统一返回 `{ error: string }`。前端按 `data.error` 解析会拿到 `undefined`。

**修复建议**

```ts
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError(401, "未登录")
  if (passwordChangeRequired(session)) return NextResponse.json({ error: "请先修改默认密码" }, { status: 403 })
  const parsed = categoryCreateSchema.safeParse(await req.json())
  if (!parsed.success) return apiZodError(parsed.error)
  const body = parsed.data
  try {
    const cat = await prisma.category.create({ data: {
      name: body.name, nameZh: body.nameZh, slug: body.slug,
      description: body.description,
      descriptionZh: body.descriptionZh,   // ← 补回
      coverImageUrl: body.coverImageUrl,
    } })
    revalidateTag("categories")
    return NextResponse.json(cat)
  } catch (e: any) {
    if (e.code === "P2002") return apiError(400, "Slug 已存在")
    console.error(e)
    return apiError(500, "创建失败")
  }
}
```

---

### 🟠 N-4 列表接口的两个"无上界"：`/api/posts` 不传 page 时无限制，服务层硬顶 100 篇

| 项 | 内容 |
|---|---|
| **定位** | `app/api/posts/route.ts:43-48`、`lib/posts.ts:184-199` |
| **类型** | 资源边界 / 静默截断 |

**问题 1：注释与实现相反**

```ts
// :43-44  注释写着「游客保持 100 上限」
const take = session ? 500 : 100
const posts = await prisma.post.findMany({
  where,
  skip: page ? (page - 1) * take : undefined,
  take: page ? take : undefined,   // ← 不传 page 时 take 是 undefined = 不限制
})
```

`take` 只在**传了 `page`** 时才生效。不传 `page`（兼容旧调用方的默认路径）时，游客与管理员都拿**全量**——注释描述的 100 上限在这条路径上不存在。

**问题 2：服务层把前台硬顶在 100 篇**

```ts
// lib/posts.ts:190-195
return prisma.post.findMany({ where, include: { category: true },
  orderBy: { createdAt: "desc" }, take: 100 })   // ← 无分页、无游标
```

`getAllPosts()` 是首页 `/`、移动端 `/m`、平板 `/t`、归档、搜索索引的**共同数据源**。文章数一旦超过 100，第 101 篇起会**静默消失**，且不报错、不告警——首页、归档、搜索三处同时少内容。当前 17 篇，是**未来的定时炸弹**（`take` 缺省时无分页逃生口，归档页也无法翻页取到）。

**修复建议**

```ts
// 问题 1：给默认路径一个明确上界（或一律要求 page）
const take = session ? 200 : 60
const posts = await prisma.post.findMany({
  where,
  skip: page ? (page - 1) * take : 0,
  take,                                  // ← 不再 undefined
})

// 问题 2：把硬顶提取为具名常量并在触顶时可观测
const FRONT_PAGE_LIMIT = 100
const rows = await prisma.post.findMany({ …, take: FRONT_PAGE_LIMIT + 1 })
if (rows.length > FRONT_PAGE_LIMIT) {
  console.warn(`[posts] 前台列表已达 ${FRONT_PAGE_LIMIT} 篇上限，超出部分不会展示——请引入分页`)
  rows.length = FRONT_PAGE_LIMIT
}
```
（或直接给 `getAllPosts` 加 `page` 参数，配合已有的 `getCachedPostRows` 分页——搜索索引需另行考虑全量索引策略。）

---

### 🟡 N-5 全仓无 lint 门禁，上一轮发现的两类问题本可被自动拦住

**现状**：
- 根目录**无** `.eslintrc*` / `eslint.config.*` / `.prettierrc` / `.editorconfig`；
- `package.json` 的 14 个 script 中**没有 `lint`**；
- `.github/workflows/ci.yml` 三个 job 只做 `tsc --noEmit` + `npm audit` + `next build` + API 集成测试。

**为什么值得补**：上一轮修掉的 49 项里，有几类**恰好是 lint 的强项**——

| 上一轮问题 | 对应 lint 规则 |
|---|---|
| P2-8 `useLang` 写在 `try/catch` 内 | `react-hooks/rules-of-hooks`（ESLint 直接报错） |
| P3-22 `isDarkMode` 死代码 | `@typescript-eslint/no-unused-vars` |
| P2-4 `remaining` state 定义后从未使用 | 同上 |
| P2-11 定时器未 cleanup / P2-10 未 abort | `react-hooks/exhaustive-deps` 可辅助提示 |

也就是说：**这四类问题本轮是靠人工审查"撞见"的，而它们本应由工具在提交时拦截。** 目前每次审查都要靠人眼重扫 123 个源文件，成本高且不可保证。

**建议**（约 15 分钟工作量）：
```bash
npx next lint   # 或装 eslint-config-next + typescript-eslint
```
接入后在 `ci.yml` 的 `quality` job 增加一步 `- run: npm run lint`；初期可先只对 `react-hooks/*` 与 `no-unused-vars` 设为 error，避免历史告警淹没信号。

---

### 🟡 N-6 依赖与仓库卫生

| # | 问题 | 证据 | 建议 |
|---|---|---|---|
| a | `@next/bundle-analyzer` **v16** 与 `next` **v15** 主版本错配 | `package.json:61` `"^16.3.4"` vs `:49` `"^15.5.24"` | analyzer 与框架同主版本更稳；`npm run analyze` 当前是否可用未实测，建议降到 `^15` |
| b | 根目录 `nul` 文件仍在 | `ls -la nul` → 210 字节，2026-09-01 生成 | `nul` 是 Windows 保留设备名，会干扰部分工具链；已在 `.gitignore:27` 但物理文件仍在。删除需用 `del "\\?\C:\…\nul"` 或资源管理器（已知 safe-delete 对保留名 fail-closed） |
| c | `.worktrees/` 下 **25 个**旧 worktree 残留 | `cat-flip`、`cover-dense`、`polish-p0p1`、`security-p0p1` … | 均为已合并的特性实验分支工作区，占空间且易与新 worktree 混淆；建议 `git worktree list` 核对后 `git worktree remove` |
| d | `X-XSS-Protection: 1; mode=block` 已废弃 | `next.config.mjs:61` | 现代浏览器（Chrome ≥78）已移除该过滤器，部分版本下反而引入漏洞。留着无害，但建议删除以免误导 |

---

### 🔵 N-7 移动端用户被强制改密时会被踢到桌面页面

| 项 | 内容 |
|---|---|
| **定位** | `middleware.ts:116-124` |
| **类型** | 体验缺陷 |

```ts
const needsChange = (req.auth?.user as any)?.needsPasswordChange
if (needsChange) {
  if (pathname.startsWith("/m/dashboard")) {
    return redirectFor(req, "/dashboard/change-password")   // ← 手机用户 → 桌面页
  }
  …
}
```

`app/m/dashboard/` 下**不存在** change-password 页（只有 `page / posts / notes / more`）。于是默认账户在手机上打开移动后台时，会被送到**桌面版**改密页——页面能渲染（middleware matcher 未拦 `/dashboard/change-password`），但版式、字号、触摸目标全是桌面规格，体验断裂。

**建议**：二选一 —— ① 新增 `app/m/dashboard/change-password/page.tsx`（复用 `MLogin` 风格）；② 若认为改密属低频高危操作、刻意要求桌面环境，则在移动端显示一个明确的"请在电脑上完成首次改密"提示页，而不是静默跳到桌面版。

---

## 四、修复优先级建议

| 批次 | 项 | 理由 |
|---|---|---|
| **立即** | **N-1** | 唯一的 P1，且是数据泄漏隐患；成本极低（删除脚本） |
| **本周** | **N-3**（补字段 + try/catch）、**N-4**（补上界 / 触顶告警） | 都是"现在不出事、将来必出事"的类型；改动小、收益确定 |
| **本周** | **N-2**（README 对齐） | 公开仓门面 + 接手者地图，一次改到位 |
| **迭代** | **N-5**（lint 门禁） | 投入产出比最高的一项长期改进：把"人工审查才能发现"变成"提交即拦截" |
| **迭代** | **N-7**（移动改密页）、**N-6**（依赖/卫生） | 体验与整洁度，不影响正确性 |

---

## 五、审查覆盖度声明

| 项 | 状态 |
|---|---|
| 自动化检查 | `npx tsc --noEmit`（EXIT 0）· `npm audit`（critical 0 / high 5）· `git status --short`（干净） |
| 逐项复核 | 上一轮 P0/P1/P2-6/P2-7/P3-1~3、P3-11/12/19/20 共 **15 项**源码级比对，**全部在位** |
| 本轮重点审计（上一轮盲区） | `scripts/`（尤其发布链路）· `README.md` 事实核对 · 未覆盖的 `app/api/categories` POST · `/api/posts` 边界 · 依赖树 · 仓库卫生 · CI 门禁配置 |
| 逆向排除 | `unstable_cache` 参数入键语义（读 Next 源码确认）· `headingsZh` 同源设计 · `redirectFor` 与 `site-url.ts` 的策略分工 —— 3 项疑似**均判定为非缺陷** |
| 未覆盖 | Vercel 生产环境的 Edge/Blob 实机行为 · `scripts/` 中 20+ 个一次性截图/内容管线脚本的逐行精读（仅做敏感信息扫描）· 未跑端到端（上一轮已在真实 PG 18.4 上完成 25/25 + 15/15，本轮不重复） |

---

## 六、给上一轮报告的两点补充说明

1. **上一轮报告 4.4 节把 `import { pinyin }` 的位置与 `lib/slug.ts` 描述为"动态 import 故不进客户端主包"** —— 本轮确认属实：`slugFromTitle()` 内 `await import("pinyin-pro")`，且 `EditorClient` 只调用同步的 `slugify()`。该设计**正确且必要**，无需改动。

2. **上一轮报告第五章"遗留未修"表中 P2-3（media filename 未清洗）** —— 本轮确认**已随 P1-5 于第一轮修复**（`lib/blob.ts:25-37` + `app/api/media/route.ts:60`），该行属报告内部的信息滞后，**不影响代码结论**。

---

## 七、修复记录（同日第二轮执行）

> 2026-09-15 19:2x–19:5x 按第四章优先级逐项落地。以下为**实际改动**与验证结果。

| 项 | 处理方式 | 关键改动 |
|---|---|---|
| **N-1** | **安全重写**（未删除，见下） | `scripts/publish-both.mjs` 整体重写为 fail-closed 版：① `FILTER_PATHS`（清洗）与 `AUDIT_FORBIDDEN`（终检）**分开定义**且后者更严（多出 env 文件、白名单 `.env.example`）；② 终检扫**全历史**（`git log --all --name-only`）+ 工作树两条，命中即 exit 1；③ 默认 dry-run，仅 `--yes` 才推送；④ 废除 merge，改 `--force-with-lease=main:<ls-remote sha>`；⑤ 不再触碰代理；⑥ 单步失败即退出。<br>**审计逻辑单测**：对私有仓当前 273 个跟踪文件扫描，精确命中 10 个敏感路径（8 content-export + 1 backups + 1 public/uploads），`.env.example` 与蓝图正常放行 —— 旧版 STRIP 恰好漏掉其中 8 个。 |
| **N-2** | 全部对齐 | README：新增「平板端（`/t`）」一节与路由清单 `/t/*`、`/tag/[tag]`；161→**270** 条字典（2 处）；Next.js 15.4→**15.5**；36 页→**43 条路由 / 25 页静态化**；结构树重写（含真实存在的 `lib/adapt.ts`，原文写的 `lib/madapt.ts` **不存在**；补 docs/、scripts/、.github、CoverArt/TabletGate/DesktopEscape）；API 表补 `search-index` / `health` / `posts/[id]/view` 并补 `page`/`X-Truncated` 说明；关键设计说明补平板分流与重定向白名单两条。另核验：公仓 README（蓝图）不含默认凭据，无泄漏。 |
| **N-3** | 已修复 | `app/api/categories/route.ts` POST 补回 `descriptionZh`，整段加 try/catch（P2002 → 400「Slug 已存在」，与 PUT/DELETE 对齐）。<br>⚠️ **连带发现**：`descriptionZh` 在**全站没有任何读取方**——仅 seed 写入、schema 校验、PUT 白名单，前台从不渲染、后台表单也没有该输入框。本次只修了 API 契约；这个字段应「补 UI + 前台渲染」或「从模型移除」，待作者决策。 |
| **N-4** | 已修复 | ① `app/api/posts/route.ts`：`take` 恒定生效（登录 500 / 游客 60），多取 1 条探测截断，被截断返回 `X-Truncated: true`——不再有无上界路径；② `lib/posts.ts`：`FRONT_LIST_LIMIT = 100` 提为具名常量，多取 1 条探测触顶，触顶打 `console.warn`（仅一次）——超限从静默变为可观测。 |
| **N-5** | 已落地 | 新增 `eslint.config.mjs`（平面配置，**最小化**：仅 typescript-eslint + react-hooks，不引 eslint-config-next 全家桶避免噪音墙）；`package.json` 加 `lint` script 与 3 个 devDeps；`ci.yml` 的 quality job 插入 `npm run lint`（在 tsc 之前）。<br>首次真实运行即暴露 **38 条真问题**（全部为上一轮 P2-4/P3-22 同类的死代码），已全部清偿：13 个未用 import、6 个未用变量、2 条失效的 eslint-disable 指令、1 个死 helper（`TiptapEditor.toolbarBtn`）、1 个死常量（`settings.ALLOWED_FIELDS`，P1-3 改 zod 后遗留）、1 处三元作语句（改 if/else）、`stripPostHeavy` 的解构剔除补 disable 注释说明、`putLocal` 形参改 `_mime`、`PostRenderer` 未消费的 `isDark` prop 改为仅保留在类型上并加说明。<br>⚠️ 教训：首次运行报 2.6 万条——**12 个 `.worktrees/*` 里的 `.next/` 与 `lib/generated/` 构建产物全被扫了**，flat config 必须显式忽略 `.worktrees/**`。 |
| **N-6** | 部分完成 | ① ✅ `@next/bundle-analyzer` `^16.3.4`→`^15.5.24`（与 next 对齐，npm install 实测通过）；② ✅ 移除已废弃的 `X-XSS-Protection` 头（原地留注释说明替代防线）；③ ⚠️ `nul`：`DeleteFileW(\\?\…)` 返回 **err 5（拒绝访问）**，`MoveFileExW(DELAY_UNTIL_REBOOT)` 同样 err 5 —— 需管理员权限，见下方遗留；④ ⛔ `.worktrees/` **不删**：实测 10/12 有未提交改动（含 `components/ArticleArt.tsx` 源码与 untracked 文档），属作者在制工作，不属于可自动清理的垃圾。 |
| **N-7** | 已修复 | 新增 `components/mobile/MChangePassword.tsx` + `app/m/change-password/page.tsx`（版式对齐 MLogin，48px+ 触摸目标，成功后 `signOut` → `/m/login?changed=1`）；`app/m/dashboard/layout.tsx` 与 `middleware.ts` 的改密重定向统一改指 `/m/change-password`；middleware 增加 `/m/change-password` matcher 与未登录守卫。<br>**设计要点**：新页**刻意不放 `/m/dashboard` 之下**——该 layout 自带「未改密即重定向」守卫，置于其下会自我重定向成死循环；canonical 按移动端惯例指回桌面改密页。 |

**验证结果**：`npx tsc --noEmit` → **EXIT 0**；`npx eslint .` → **EXIT 0（0 error / 0 warning）**；`next build` → 结果见下。

**遗留（需作者处理）**
1. `nul` 文件：非提权进程删不掉（err 5）。管理员 cmd 执行一条即可：
   `del "\\?\C:\Users\Yahajiang\Desktop\AstrBot插件\慢日志\nul"`
2. `.worktrees/` 12 个 worktree：**有未提交工作，请自行取舍**。确认不要后：
   `git worktree remove <路径> --force`（force 会丢弃未提交改动，慎用）
3. `descriptionZh` 字段的三选一决策（补 UI 渲染 / 只删 UI 留数据 / 连模型一起删）。
4. `react-hooks/exhaustive-deps` 暂未启用（两条历史 disable 指令已随之移除）；待告警量可控时再开为 warn。
5. 版本号未动（仍 0.3.9）——是否为这轮修复 bump 到 0.3.10 并补版本历史，由作者定。

---

*本报告由 WorkBuddy 独立复核生成 · 2026-09-15 · 基线 `55861cc`（修复后待提交）*
