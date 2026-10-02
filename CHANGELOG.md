# 更新日志 Changelog

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/) 与 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 规范。
类型含义：**Added** 新增功能 / **Changed** 已有行为或规范的改变 / **Fixed** 缺陷修复 / **Removed** 移除 / **Security** 涉及安全。

## 版本跳转

**[Unreleased]**（`2b29bea` 之后的 14 条提交：仓库治理 / 凭据出仓 / pageConfig 哨兵 / 文档对账）· [0.5.5](#055--2026-10-01) · [0.5.0](#050--2026-09) · [0.3.9](#039--2026-09) · [0.3.8](#038--2026-09) · [0.2.0](#020--2026-09) · [0.1.x](#01x--2026-08) · [0.1.0](#010--2026-08)

> 每条格式：**结论** ｜ 细节 ｜ 位置。想知道"为什么这样定"看 `docs/project-map.md` 第十一节坑位速查与第十二节待决项。


## [Unreleased] — 2026-10-02 累积（未发版）

> 只收 `2b29bea`（v0.5.5）之后的 14 条提交（`c939529`…`8f85a7c`）。原先记在本段的 22 条其实是 `2b29bea` 的祖先、已随 0.5.5 发布，现归入 [0.5.5](#055--2026-10-01) 的「同批并入」子节。
### Added

| **结论** | 细节 | 位置 |
|---|---|---|
| **`docs/project-map.md`** | 按目的跳转的仓库地图：五棵路由树 / 请求流 / 数据层与缓存 / 鉴权矩阵 / 设计系统 / 仓库约定 / 坑位速查 / 待决项 | `docs/project-map.md` |
| **README 重写为入口文档** | 「怎么读这份文档」路由表 + 30 秒速览（数字全现测，含口径）+ 技术栈 + 环境变量 + 数据模型 + 关键设计速查 + API 一览 + 目录结构 + 质量门 + 文档地图；不再内联版本历史表（由本文件承接，两处各写一份必然分叉） | `README.md` |
| **CHANGELOG 结构化** | Keep a Changelog + semver：版本跳转索引；`[Unreleased]` 按 Added/Removed/Fixed/Changed/Security 表格逐条「结论｜细节｜位置」，另立「发布与仓库治理」「验证」两段；七个历史版本全保留 | `CHANGELOG.md` |
| **CI 新增 pageConfig 默认值一致性门禁** | `node scripts/check-page-config-default.mjs` 挂在「类型检查 + 依赖审计」job 的 tsc 之后：`UNSET_PAGE_CONFIG` 与 `Post.pageConfig` / `Setting.defaultPageConfig` 三处默认任一漂移即 rc=1 并指名字段；不连库、不起服务 | `.github/workflows/ci.yml` |
| **`.env.example` 补默认账户变量** | `AUTH_DEFAULT_PASSWORD`（不给则「仍是默认账户」判定恒 false）与可选 `AUTH_DEFAULT_EMAIL`；README 环境变量表同步收录 | `.env.example`、`README.md` |

### Removed

| 结论 | 细节 | 位置 |
|---|---|---|
| **删 25 个一次性脚本** | 16 个依赖未声明 Playwright 的截图/量测脚本 + 7 个已执行完的数据迁移脚本 + 硬编码 postId 的 schedule-e2e + PowerShell 版 smoke-test。判据：除自身用法注释外全仓零引用，`package.json` 与 CI 都不调用 | `scripts/` |
| **公开镜像不再 ship 四份审查文档** | `full-review-2026-09-15.md`（89.6 KB / 50 条编号：P0×2、P1×6、P2×16、P3×26）、`audit-2026-09-15-independent.md`、`backend-review-2026-09-14.md`、`compose/spec/security-p0p1.md` 只进私有仓 | `scripts/publish-both.mjs` |

### Fixed

| 结论 | 细节 | 位置 |
|---|---|---|
| **站点夜版/显示目录对文章全部失效** | `withSiteDefaults` 判「未定制」拿的是 `DEFAULT_PAGE_CONFIG`（`theme=system`/`showTOC=true`），而未进过配置面板的文章实际带的是 Prisma 列默认（`theme=light`/`showTOC=false`）⇒ 两者永不相等，站点默认从不回填，`PostClient` 见 `theme==="light"` 就给每篇挂 `sl-force-light`，夜版进不了文章页。判据换成与列默认逐字段相同的 `UNSET_PAGE_CONFIG` 哨兵，零迁移零回填；新增 `scripts/check-page-config-default.mjs` 静态守卫并接进 CI 类型检查阶段（改坏哨兵实测 rc=1 并指名字段）。代价：显式选成 light+不显示目录 的文章会被当作未定制 | `lib/page-config.ts`、`scripts/check-page-config-default.mjs` |
| **`mobile-preview/` 从没被 .gitignore 覆盖** | `c939529` 称「这些目录早已被 .gitignore 覆盖」，实测四条里只有三条成立：`backups/`、`content-export/`、`/public/uploads` 命中，`mobile-preview/` 漏。取消跟踪后 13 张截图（5.5 MB）以 `??` 裸在 `git status`，下一次 `git add -A` 就把它们拉回版本库 —— 正是当初要防的那次 force-add。同时把注释里的「这两个目录」改成实际四个 | `.gitignore` |
| **蓝图与真代码脱节** | 头部四行「核对/复核」删掉，换成一行现测值并声明数字唯一出处是文末《附、速查清单》：类目 5 族 · 符号映射 56 键 → 8 符号 · 画廊 65 条目 · 路由级 loading 18 个 · 字典 zh/en/Dict 各 339 键 · 动效四档 180/220/300/500ms；符号轴「32 键」改「56 键（中英各占一键）」；版本戳 v0.3.9 → v0.5.5（对齐 `package.json`） | `docs/design/design-blueprint.md` |
| **三处截图引用在公开仓是死链** | `hero-cover` / `card-cover` / `cover-eng-zones` 三份 spec 的 Verification 段点名 `mobile-preview/0[789]-*.png`，那些截图既不入库也被镜像清洗 ⇒ 就地标注「只留本地，不入仓」，不再让读者去找不存在的文件 | `docs/compose/spec/` |
| **公开 README 不再被覆写成设计蓝图** | `publish-both.mjs` 步骤⑦原先把蓝图整份拷成公开仓 README；蓝图是带复核流水账的内部文档，头部同时留着 loading 12/15/17/18 四组中间值与「⚠️ 未复测」批注，公开门面因此自相矛盾。现两侧门面同一份（仓内入口文档），⑦只保留「README 必须存在且声明 GPL-3.0」的兜底校验 | `scripts/publish-both.mjs` |

### Changed

| 结论 | 细节 | 位置 |
|---|---|---|
| **设计蓝图补章节** | 新增 §六 上下篇定案、§九 后台标题、§十一 归档与匹配口径、§十二 危险五档与语义三色、§文案单一来源与品牌块/量词单一实现（`docs/project-map.md` 本身见 Added） | `docs/design/design-blueprint.md` |
| **全量文档对账（数字全部重测）** | README 与项目地图的源码数 **199→206**（口径写进表里：git 跟踪、不含 `lib/generated/` 与 `next-env.d.ts`）；`Setting` **12→13 字段**；后台「壳 + Client」页面 **13→16**（桌面 9 + 移动 7 —— 旧数漏了 `app/dashboard/page.tsx` 与 `app/m/dashboard/page.tsx` 两个根页，`git ls-files 'app/dashboard/**/page.tsx'` 的 `**` 不匹配零层目录）；首屏编译 **9s→10s**。CHANGELOG 里 `full-review` 的「77 处 P0-P1」改成 **50 条编号（P0×2、P1×6、P2×16、P3×26）**。`gallery-DESIGN.md` 版本戳 v1.8→**v1.9**、条目 **58→65**、stagger 改成实测「60ms 起步 / 45ms 递增 / 11 项封顶 465ms」并补 v1.9 落地行。蓝图「继续阅读」不再写成 `同分类 > 同标签` 的分层淘汰（与 `×10 + ×3` 叠加自相矛盾） | `README.md`、`CHANGELOG.md`、`docs/project-map.md`、`docs/design/gallery-DESIGN.md`、`docs/design/design-blueprint.md` |
| **注释只解释与介绍** | 注释里的历史重复计数与审计叙述清掉，规则说明收在实现处一处；顺带修掉三处失真：`app/layout.tsx` 把 `postOgMeta` 指到 `lib/adapt.ts:101`（实际 121，改成不带行号的符号引用）、两棵文章页把相关文章复述成「同分类 > 同标签」的分层淘汰（实际是 ×10 + ×3 叠加，可反超）、`DELETE /api/categories/[id]` 的「检查分类下是否有文章」换成真实原因（外键关系下先数一遍换可读 400） | `components/ui/Panel.tsx`、`AdminTitle.tsx`、`Input.tsx`、`lib/categories.ts`、`lib/adapt.ts`、`app/layout.tsx` |

### Security

| 结论 | 细节 | 位置 |
|---|---|---|
| **默认管理员口令不再进仓库** | 此前 `README.md` 直接印出默认邮箱与初始口令，`lib/auth.ts` 与 `prisma/seed.ts` 各写死一份。现在初始口令只能来自 `AUTH_DEFAULT_PASSWORD`，缺省则播种中止（不给 env 时连类目都不写库）；"是否仍是默认账户"从明文相等改为**用 env 初始口令比对 bcrypt 哈希** ⇒ 改过密自然不再命中，无需新增字段、不会强制改密循环。README 明文行与 `test-force-password.mjs` 注释里的历史明文一并去掉；CI 的 `api-tests` job 补该变量 | `lib/auth.ts`、`prisma/seed.ts` |
| **23 个数据产物移出跟踪** | `backups/` 的 DB dump ×1、`content-export/` ×8、`mobile-preview/` ×13、`public/uploads/` ×1，共 **6.16 MB（占仓库 68%）**。这些路径本就在 `.gitignore` 里，但 gitignore 对已跟踪文件无效；文件仍留磁盘，历史未改写 | `git rm --cached` |

### 发布与仓库治理（非代码变更）

| 事项 | 细节 |
|---|---|
| **main 对齐** | 本地落后 1 条时先逐文件证明那 45 个「作者未提交」文件与 `2b29bea` 内容一致（忽略 CR 后 md5 45/45），备份成 patch 再 `git restore`，然后 `merge --ff-only` 无损推进；随后并入 `chore/remote-cleanup` 的 4 条治理提交（`c939529`…`49adfcf`），无冲突 |
| **死 worktree 注册清掉** | `git worktree prune` 移除 13 条指向已消失目录的注册（分支全留，`feat/cover-*` 10 条仍在）；`worktree list` 从 15 条降到主树 1 条 |
| **23 个数据产物找回** | 取消跟踪后主工作树其实**缺**这 23 个文件的磁盘副本（只在旧 worktree 里）。先按 git 对象号证明与 `2b29bea` 逐一相同（23/23，全程未读内容），再从历史原字节物化回主树，回读校验 0 处不一致；磁盘现存 8.4 MB，四条路径全部命中 ignore |
| **双仓发布 4 次** | `origin/main`：`d867422 → bcdce85 → f2773a3 → 8adc810 → 8f85a7c`；`SLOWLOG-1/main`：`98f788b → 6e04a43 → f291522 → dd23cd7 → 0ab6d2e`。首两次是 `--force-with-lease` 强推（镜像历史被 filter-repo 重写），后两次 fast-forward——清洗后的历史跨轮稳定 |
| **⚠️ 镜像短 SHA 不可跨仓互查** | 重写后三条提交标题里内嵌的短 SHA 两边指向不同对象（`8846f58..d791277` ↔ `2b02a3a..5404634`、`46c163f` ↔ `5b6fb0a`、`7c0c57e` ↔ `f014e83`）；两边根提交同为 `a7ee200d`（未触及被剔路径，哈希保留） |
| **公开镜像差异收口** | 与私有仓唯一内容差 = 私有的 4 份审查文档；`README` 不再被覆写 ⇒ 两侧门面同一份文件。跟踪文件 私有 295 / 公开 291 |
| **⚠️ 部署侧待办** | Vercel 需补 `AUTH_DEFAULT_PASSWORD`：env 缺失时登录照常，但「首登强制改密」判定恒 false。`docs/project-map.md` 第十二节第 5 项已标 ⚠️ |

### 验证

- 构建三连：`tsc --noEmit` 0 / `eslint .` 0 / `next build` 通过（Compiled successfully in 9.8s；共享 chunk 103 kB；路由 54 = 8 静态 + 2 SSG + 44 动态）。构建期只剩既有 libpq SSL 提示，与本批改动无关
- pageConfig 修复用真实模块跑函数（`node --experimental-strip-types` 直导 `lib/page-config.ts`）：未定制文章 + 站点夜版/目录开 ⇒ `theme=dark`、`showTOC=true`、`theme==="light"` 判定为 false；定制过 serif/wide/底色的文章字段保留、其余仍回退；站点默认未改时结果仍是 `light/false`，无行为变化。哨兵与两处列默认逐字段差异实测 `[]`
- CI 守卫反向验证：把哨兵 `showTOC` 改成 `true` → 脚本 rc=1 且输出 `Post.pageConfig — showTOC: 哨兵=true 列默认=false`；改回 → rc=0
- 注释与文档里的数字断言逐条回到引入提交复测：`AdminTitle` 11→12、`PANEL_CLS` 11→18（12 文件）、`TAG_SYMBOL_MAP` ~20→56 键 / 8 符号、`Input` 5 份配方=11 文件 26 落点、标题自拼 8→10 页、`lib/adapt.ts:101` 实指 121。字典键数用花括号深度法测得 zh/en/Dict 各 **339、零重复**（一版粗测量出 en=341，是把函数型值与嵌套键也数了进去，作废）
- 发布终检（每次 `publish-both.mjs --yes` 都过）：全历史 394 路径 0 命中、清洗后工作树 291 文件 0 命中；强推租约取自 `ls-remote`，取不到即拒推
- 公开 tip 独立复查（不采信脚本自述）：`admin123` 0 命中、数据产物路径 0、四份审查文档 0、`.gitignore` 含 `mobile-preview/`、README 与私有 README **0 行差异**
- 文档表结构按列分隔符计数：README 74 / CHANGELOG 34 / 项目地图 55 / 蓝图 44 行数据，0 处不匹配；并修掉蓝图「加载态」那行在三列表里写成四格（GFM 会把多出的格丢到不确定位置）
- ⚠️ 未验：读者端夜版进文章页的浏览器实测（需先在后台把站点默认主题调成夜版，属生产数据未动）；后台 `ListError` 与复制钮的视觉验收；本机无可用 `gh`，CI 流水线结果没读到

---

## [0.5.5] — 2026-10-01

### Fixed
- **暗色模式分隔符不可见**：编辑器面包屑 `/` 原用 `text-zinc-200`，暗色下几乎不可见 → 改语义 token `text-[var(--yh-muted)]`
- **Toast 定时器泄漏**：卸载时未清理退场定时器，组件卸载后仍可能触发状态更新 → 卸载即清理，并限制最多同时 3 条

### Changed
- **阴影 token 化**：消除全站 `shadow-sm/md/lg/xl/2xl` 与 `shadow-[0_...]`，统一映射 `--shadow-card`（卡片）/ `--shadow-float`（浮层、回到顶部、灯箱）/ `--shadow-pop`（弹出菜单、Toast、开关钮）
- **圆角统一**：编辑器 FloatingMenu 残留 `rounded` 压平为 `rounded-none`；`rounded-full` 仅保留生命感元素（品牌 S 章标、头像、封面圆点、hero 指示点）
- **配色 token 化**：源码中 `text-white` / `bg-white` / `border-white` 与 `zinc-*` 硬编码全部清零（`globals.css` 仅保留暗色兜底层），一律走 `--yh-*` / `--dash-*`
- **404 / Error / 登录 / 加载骨架 / 目录抽屉 / Thinking / 目录组件**：阴影与进出场动效接入统一令牌

### Added
- **无障碍**：Toast 容器 `role="status" aria-live="polite"`，错误型 Toast 再挂 `role="alert"`

### Removed
- **23 个数据文件移出版本库**：早先被 `force-add` 跟踪的 `backups/`×1、`content-export/`×8、`mobile-preview/`×13、`public/uploads/`×1（文件保留磁盘）；`.gitignore` 补注释说明这段历史，防止再次 force-add

### 同批并入（`8578ea7`…`9bc3c8d`，随 `2b29bea` 一起发布）

> 这 22 条此前被记在 `[Unreleased]`，但其提交都是 `2b29bea` 的祖先 ⇒ 实际已随 0.5.5 落地。分流依据：`git merge-base --is-ancestor` + 被引文件是否出现在 `2b29bea..main` 的 14 条提交里。原文照搬，未改写细节。

#### Fixed

| 结论 | 细节 | 位置 |
|---|---|---|
| **归档搜索会崩整条时间线** | 服务端按 标题/标题中/**摘要/摘要中**/分类名 五路命中，客户端却各写「只看标题+分类名」的窄规则二次过滤，而列表载荷里 `p.category` 是对象 ⇒ 搜一个只出现在摘要里的词抛 `TypeError`。规则收成一处 | `lib/archive-match.ts` |
| **刊头统计口径混用** | 搜索时页头写「全部 0 篇」、POSTS 卡显示 0，同一行 YEARS/CATEGORIES/LATEST 却是全站值。`getArchiveStats()` 补 `postCount`；「筛选 N」桌面吃服务端 `total`（跨页才准）、移动吃 `countYears` | `lib/posts.ts`、`app/(shell)/archive/ArchiveClient.tsx` |
| **后台"骨架屏转到天荒地老"** | 9 个后台首屏只写 `fetch().then(r => r.json())`，401/500/断网都不会把 `loading` 置回 false。收口到 `loadList/loadObject`（永不 reject）+ 新增 `ListError`（说明 + 重试），与"没有数据"彻底分开；`TokenManager` 也不再"失败画成暂无令牌" | `lib/admin-fetch.ts`、`components/ui/ListError.tsx` |
| **夜版实心危险钮 2.97:1** | 白字压暗红。新增第五档 `--dash-danger-fg`（亮 `#ffffff` / 夜 `#231210`），`Dialog`/`Toast`/批量删除统一改吃；`--dash-danger-soft` 提到 `#fdf6f5` 使文字过 AA | `app/globals.css` |
| **根 layout 崩了没有兜底** | 新增 `global-error.tsx`（自渲染 `<html>/<body>`；位于所有 Provider 之外，因此不调 `useLang()`，改按 `navigator.language` 取字典） | `app/global-error.tsx` |
| **标签页越界画空卡** | `/tag/[tag]?page=999` 原先 `total>0` 却 0 条，只画一张带边框的空卡；现在回落到最后一页 | `app/tag/[tag]/page.tsx` |
| **移动后台「随想」没有翻页出口** | 只取第一页且无任何出口（>50 条永久看不见），补 48px 上/下页与页码 | `app/m/dashboard/notes/MNotesClient.tsx` |
| **归档空态没有出口** | 「清除筛选」原本只在页头统计行，读者面对空卡要往上滚。现空态卡内嵌 48px 按钮，并定规则「有结果=页头清链 / 零结果=卡内 CTA」，同一动作不再两个控件并现 | `app/(shell)/archive/ArchiveClient.tsx`、`components/mobile/MArchive.tsx` |
| **搜索入口无障碍名散成 5 份** | 其中 `SearchButton` 只有中文（英文用户读屏听到「全局搜索」四个汉字）→ 新建 `searchGlobalAria`/`searchGlobalTitle`，11 处消费 | `lib/i18n.ts` |
| **英文量词系统性错误** | 「1 years」「1 posts」→ 加 `pl(n, word, plural?)`，6 个 formatter 改吃 | `lib/i18n.ts` |
| **窄视口品牌断字** | 645px 归档页头、390px 阅读页把「慢日志」竖排成几行 → 品牌 `whitespace-nowrap`、拉丁副名 `<md` 让位 | `components/SiteBrand.tsx` |
| **登录框读屏念不出字段名** | `label` 无 `htmlFor`、`input` 无 `name`/`autoComplete`（桌面 + 移动）→ 补齐 `username` / `current-password` | `app/(shell)/login/LoginForm.tsx`、`components/mobile/MLogin.tsx` |

#### Changed

| 结论 | 细节 | 位置 |
|---|---|---|
| **输入框一档实现** | `inputCls(size, tone, extra)`：sm/md 36px、lg 48px；tone=admin 走 `--dash-*`、front 走 `--yh-*`。接入 14 处 + 归档两版搜索框 | `components/ui/Input.tsx` |
| **重复类名收成常量** | 后台卡片外壳 18 份 → `PANEL_CLS`；页主标题 12 份 → `<AdminTitle>`；品牌圆标 4 份 → `<BrandMark>`；编辑器工具栏图标钮 9 份 → `ICON_BTN`；灯箱控制钮 6 份 → `ICON`；品牌块 4 份 → `<SiteBrand>`（站名/Logo 改由站点设置下发） | `components/ui/Panel.tsx`、`AdminTitle.tsx`、`SiteBrand.tsx` |
| **动效单一实现** | `Dialog`/`FormField`/`Toast` 各自在 JSX 里塞 `<style>` 注册 `@keyframes`（`Dialog` 的 `scaleIn` 已与全局分叉 0.96 vs 0.98）→ 全部搬进 `globals.css`；时长字面量归 `--duration-*`，全仓 tsx 内三档裸数字残留 0 | `app/globals.css` |
| **语义色令牌化** | `--dash-ok/warn/info` ×三档（底/字/边）入亮暗两组；`Badge` 的 tone 由色相名（emerald/amber/sky）改语义名；状态徽标、Toast、表单错误同源 | `app/globals.css`、`components/ui/Badge.tsx` |
| **触屏按下反馈** | 移动前台与移动后台共 30 处 48px 目标只有颜色变化、无按下态 → 统一 `active:opacity-60` | 移动树组件 |
| **后台页名各页自出** | **16 个页面**拆「服务端壳（`metadata`）+ `<X>Client.tsx`」（桌面 9：概览/文章/编辑器/分类/媒体/随想/设置/令牌/改密 + 移动 7：概览/文章/随想/更多/设置/分类/令牌）各有页名；中间层 layout 不再写 `title`（浅合并会吃掉根 `template`） | `app/dashboard/**`、`app/m/dashboard/**` |
| **文案收进字典** | 字典 **339/339/339** 逐键对称；后台分页钮 8 处硬写 `{lang==="zh"?"上一页":"Prev"}` 改吃既有 `pagePrev/pageNext`（英文侧因此 `Prev` → `Previous`，与随想翻页钮同词）；归档 kicker/placeholder、行内「保存/取消」等内联双语清零 | `lib/i18n.ts` |
| **加载边界补齐** | 后台路由级 `loading.tsx` 到 **18** 个（含补上的 `/m/dashboard/settings`） | `app/**` |
| **画廊与代码对齐** | `:root`/`.dark` 补齐 dash 别名、危险五档、语义三色、`--duration-exit`/`--motion-grow`；语义裸 hex 改 `var()`（含删除确认预览那对 `#dc2626 + #fff`）；条目 58 → **65**，新增 `admin-input`/`admin-shell`/`list-error`/`semantic-palette`/`touch-two-tier`/`motion-tiers`/`i18n-source` | `public/design/gallery.html` |

#### Removed

| 结论 | 细节 | 位置 |
|---|---|---|
| **删掉桌面与平板的「上一篇 / 下一篇」** | 作者定案：`PostClient` 的整块 section、`prev/next` props 与 chevron 图标一并移除，`/posts/[id]` 与 `/t/posts/[id]` 不再取相邻文章。**移动版保留改版前就有的纵向上下篇**；`lib/adapt.pickAdjacent` 与字典 `previous/next` 两键的唯一消费者就是它，不是死代码 | `components/PostClient.tsx` |
### 验证
- `next build` 通过：编译成功，64/64 静态页全部生成

---

## [0.5.0] — 2026-09

**正式版。**

### Added
- 站点设置全链路打通：12 字段此前 11 个「只存不用」→ 元数据 / Header / Footer / manifest / OG 全部由后台驱动
- 移动后台设置板块（底部 5 Tab）；设置页按消费端板块化（站点信息 / 页脚 / 品牌资源 / 阅读与外观）
- 后台过渡动画体系（整块落定 + 条目错落，`prefers-reduced-motion` 全关）
- ESLint 门禁（CI 已接）

### Changed
- 消除 soft-404：`loading.tsx` 边界作用域重构，详情段真 404
- 阅读页 canonical / noIndex 接入 SEO
- 后台响应式：侧栏窄视口自动折叠

### Security
- 发布脚本 fail-closed 重写（防 data 泄漏）

---

## [0.3.9] — 2026-09

### Changed
- 类目体系重构 7 → 5（设计 / 开发 / 实验 / 发现 / 记录：调色板、全站文案、17 篇重挂）
- 封面系统与画廊契约同步

### Fixed
- 8 篇脏标签数据清理

### 验证
- 全站回归三连测（81 项 × 3 全绿）

---

## [0.3.8] — 2026-09

### Changed
- 目录进度重做：点击即时反馈 / 末尾几节渐进点亮不跳节 / 左轨对齐小节行
- 17 篇文章重写（去模板化，用上任务列表、表格、对齐、行内色等编辑器能力）

### Fixed
- 内容管线修复：行内格式与段落不再丢失、对齐真正落地
- 标签页整页报错与脏标签修复

---

## [0.2.0] — 2026-09

### Added
- 移动端独立版（`/m` + 轻量后台）
- 全站 i18n 补齐；阅读页彩色字；`next/font` 自托管

### Changed
- 后台性能优化：API 瘦身 / 缓存 / 骨架屏

---

## [0.1.x] — 2026-08

### Added
- 文章封面系统、Footer、随想优化

### Security
- 升级 Next.js 15.4.11（安全漏洞修复）

---

## [0.1.0] — 2026-08

### Added
- 初始版本：Prisma 后台 + 安全加固 + Tiptap 编辑器 + 强制改密
