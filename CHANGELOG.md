# 更新日志 Changelog

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/) 与 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 规范。
类型含义：**Added** 新增功能 / **Changed** 已有行为或规范的改变 / **Fixed** 缺陷修复 / **Removed** 移除 / **Security** 涉及安全。

## 版本跳转

**[Unreleased]**（0.5.5 之后：阅读页主题与目录回退、默认账户判定）· [0.5.5](#055--2026-10-01) · [0.5.0](#050--2026-09) · [0.3.9](#039--2026-09) · [0.3.8](#038--2026-09) · [0.2.0](#020--2026-09) · [0.1.x](#01x--2026-08) · [0.1.0](#010--2026-08)

> 每条格式：**结论** ｜ 细节 ｜ 位置。想知道「为什么这么设计」看 `docs/project-map.md`。

## [Unreleased] — 2026-10-02 累积（未发版）

> 0.5.5 之后的改动。

### Fixed

| 结论 | 细节 | 位置 |
|---|---|---|
| **站点夜版与「显示目录」对文章全部失效** | `withSiteDefaults` 判「未定制」拿的是 `DEFAULT_PAGE_CONFIG`（`theme=system`/`showTOC=true`），而未进过配置面板的文章实际带的是 Prisma 列默认（`theme=light`/`showTOC=false`）⇒ 两者永不相等，站点默认从不回填，`PostClient` 见 `theme==="light"` 就给每篇挂 `sl-force-light`，夜版进不了文章页。判据换成与实际存储值逐字段相同的 `UNSET_PAGE_CONFIG` 哨兵；代价：显式选成 light+不显示目录 的文章会被当作未定制 | `lib/page-config.ts`、`scripts/check-page-config-default.mjs` |

### Security

| 结论 | 细节 | 位置 |
|---|---|---|
| **默认账户判定不再依赖明文口令** | 初始口令从代码里移除，只由环境变量 `AUTH_DEFAULT_PASSWORD` 提供（缺该变量时播种直接中止）；"是否仍是默认账户"从明文相等改为**用 env 初始口令比对 bcrypt 哈希** ⇒ 改过密自然不再命中，无需新增字段、不会强制改密循环。缺该变量时判定恒为「不需改密」，登录本身不受影响 | `lib/auth.ts`、`prisma/seed.ts` |

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

### 同批的其余改动

> 以下 22 条与上面的视觉系统统一属同一批。

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
## [0.5.0] — 2026-09

**正式版。**

### Added
- 站点设置全链路打通：12 字段此前 11 个「只存不用」→ 元数据 / Header / Footer / manifest / OG 全部由后台驱动
- 移动后台设置板块（底部 5 Tab）；设置页按消费端板块化（站点信息 / 页脚 / 品牌资源 / 阅读与外观）
- 后台过渡动画体系（整块落定 + 条目错落，`prefers-reduced-motion` 全关）

### Changed
- 消除 soft-404：`loading.tsx` 边界作用域重构，详情段真 404
- 阅读页 canonical / noIndex 接入 SEO
- 后台响应式：侧栏窄视口自动折叠

---

## [0.3.9] — 2026-09

### Changed
- 类目体系重构 7 → 5（设计 / 开发 / 实验 / 发现 / 记录：调色板、全站文案、17 篇重挂）
- 封面系统与画廊契约同步

### Fixed
- 8 篇脏标签数据清理

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
