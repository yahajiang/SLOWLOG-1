# SlowLog 慢日志

> 慢下来，写点值得读的东西。

一个基于 Next.js 15 的双语（中文/英文）个人博客系统：杂志式前台排版、独立移动端、Prisma 后台管理、Tiptap 富文本编辑、Vercel Blob 媒体库，开箱即部署到 Vercel。

- 前台：`/` 首页 · `/archive` 归档 · `/posts/[id]` 阅读页 · `/login` 登录
- 移动端：`/m`、`/m/archive`、`/m/posts/[id]`、`/m/login`、`/m/dashboard/*`（手机 UA 自动进入，平板走桌面）
- 后台：`/dashboard`（仪表盘/文章/分类/媒体库/随想/设置）

## 功能特性

### 前台阅读
- 首页：推荐 Hero（自动轮播）、分类 Tab 筛选、全文搜索、按分类分区分组展示、随想时间线、近 2 年时间线卡
- 归档页：全部文章按年份分组，支持标题/分类搜索
- 阅读页：杂志式头图区、吸顶阅读进度条（按文章滚动计算＋剩余分钟）、常驻目录侧栏（滚动高亮＋点击锁定 800ms）、侧栏阅读进度卡、图片灯箱、上一篇/下一篇导航、CC BY-NC-SA 版权声明
- 封面系统：7大家族纸色 × 8 场景符号 × 多徽章位置的程序化 SVG 封面（FNV-1a 哈希稳定映射），分类决定配色、首标签决定场景
- RSS 订阅（`/rss.xml`）与 Sitemap（`/sitemap.xml`），文章页 JSON-LD 结构化数据

### 国际化（中/英一键切换）
- `lib/i18n.ts` 161 条 zh/en 1:1 字典，`LangProvider` 全局语言上下文（localStorage 记忆）
- 前台文案、分类名、日期、相对时间（刚刚/x 分钟前 ↔ just now/x min ago）全部本地化
- Logo `慢日志·SLOWLOG` 为统一品牌标识，不随语言切换；标签、标题摘要为作者原文（中英独立字段），不做机器翻译
- 后台保持中文（面向站长）

### 移动端独立版（`/m`）
- 与桌面**同风格**（同一套 CSS 变量/字体/封面/文案），只改版式：单列全宽、紧凑顶栏、分类横滑、纵向上下篇、悬浮目录钮＋底部抽屉、44px+ 触摸目标
- `middleware` 按手机 UA 自动改写（地址栏不变），`view=desktop` cookie 可切回桌面，平板默认走桌面
- 移动页 `canonical` 全部指回桌面 URL，权重归一；Sitemap 只收录桌面地址
- 轻量移动后台 `/m/dashboard`：数据概览、文章管理（搜索/上下架/删除/复制链接）、随想速记、分类与媒体查看；完整编辑请用桌面版

### 后台管理（桌面）
- 仪表盘：文章/发布/草稿/访问量统计（groupBy 单查询＋60s 缓存）、近期文章、快速入口
- 文章：Tiptap 图形化编辑（分栏/源码三模式、查找替换、特殊字符、版本历史保留 4 版）、发布/草稿/推荐/复制/批量删除、SEO 字段、页面主题配置（布局/深色/主色/字体/宽度/目录显隐）
- 分类 / 媒体库（拖拽上传、JPEG/PNG quality:75 压缩、复制链接）/ 随想（≤500字）/ 站点设置
- 列表骨架屏、全局错误边界、操作 Toast 反馈

### 性能
- `/api/posts` 列表接口排除 `content` 大字段（~66KB → ~6KB）；`unstable_cache` 包裹列表/分类/随想/统计查询；API `Cache-Control` 分级缓存
- `next/font` 三字体自托管（Plus Jakarta Sans / JetBrains Mono / Cormorant Garamond，`display: swap`）
- Tiptap 编辑器与阅读器 `next/dynamic` 懒加载；`lucide-react` 按需 modularize；`@next/bundle-analyzer` 可观测（`ANALYZE=true npm run build`）
- 图片 AVIF/WebP、静态资源长缓存、Gzip 压缩

### 安全
- NextAuth 5 Credentials + JWT；Middleware 鉴权保护后台路由；默认账户首次登录强制改密
- API：GET 公开，POST/PUT/DELETE 需认证；媒体上传 MIME 白名单（JPEG/PNG/WebP/GIF），SVG 禁止（防存储型 XSS）
- 富文本颜色走白名单渲染（hex/rgb/hsl/命名色），`expression()`/`url()` 等注入直接过滤

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 15.4 (App Router) + React 19 |
| 样式 | Tailwind CSS v4（CSS 变量设计令牌 `--yh-*`/`--dash-*`，全站直角） |
| 数据库 | PostgreSQL (Neon) + Prisma 6 (`@prisma/adapter-pg`) |
| 认证 | NextAuth 5 (Credentials + JWT) + bcryptjs |
| 编辑器 | Tiptap 3（StarterKit＋表格/任务列表/代码高亮/文字颜色/链接/图片等） |
| 媒体 | Vercel Blob + sharp 压缩 |
| 校验 | zod |
| 部署 | Vercel（Git 推送自动部署） |

## 数据模型（`prisma/schema.prisma`）

| 模型 | 说明 |
|------|------|
| `User` | 管理员账户（邮箱＋bcrypt 密码 hash） |
| `Category` | 分类（英文名＋中文名＋slug＋描述） |
| `Post` | 文章（中英双语标题/摘要/正文 JSON、slug、状态、标签、阅读时长、浏览量、SEO、页面配置） |
| `Note` | 随想（中英双语短内容） |
| `Media` | 媒体文件（Vercel Blob URL＋尺寸＋MIME） |
| `Setting` | 站点设置（键值） |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 复制环境变量并填写（见下表）
cp .env.example .env

# 3. 同步数据库结构
npx prisma db push

# 4. 启动开发服务器
npm run dev
# → http://localhost:3000
```

**默认管理员**：`admin@slowlog.dev` / `admin123`（首次登录强制改密；生產环境请先改密或删除默认账户）

```bash
npm run build    # prisma generate && next build（生产构建）
npm start        # 启动生产服务
ANALYZE=true npm run build  # 包体积可视化分析
```

### 环境变量

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | Neon PostgreSQL 连接串（`?sslmode=require`） |
| `AUTH_SECRET` | NextAuth JWT 密钥（NextAuth 5 默认变量名） |
| `NEXTAUTH_URL` | 站点地址（如 `https://your-domain.vercel.app`） |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 读写 token |
| `NEXT_PUBLIC_SITE_URL` | 站点地址（SEO canonical / OG / sitemap 用） |

## 项目结构

```
├── app/
│   ├── page.tsx              # 首页（服务端取数 → HomeClient）
│   ├── archive/              # 归档页（按年份分组）
│   ├── posts/[id]/           # 阅读页（slug/id 双兼容＋上一篇/下一篇）
│   ├── login/                # 登录页
│   ├── m/                    # 移动端独立版（/m、/m/archive、/m/posts/[id]、/m/login、/m/dashboard/*）
│   ├── dashboard/            # 后台（仪表盘/文章编辑器/分类/媒体/随想/设置）
│   ├── api/                  # posts / categories / thoughts / media / settings / auth
│   ├── rss.xml/ sitemap.ts   # RSS 与站点地图
│   ├── loading.tsx           # 全局加载骨架
│   └── Providers.tsx         # LangProvider + ToastProvider
├── components/
│   ├── mobile/               # 移动端组件（MHeader/MFooter/MHome/MArchive/MPost/MLogin/后台）
│   ├── dashboard/            # 后台组件（Sidebar/StatCard/Skeleton）
│   ├── editor/               # Tiptap 编辑器 + PostRenderer 阅读渲染器
│   ├── ui/                   # 基础 UI（Button/Input/Dialog/Toast…）
│   ├── ArticleArt.tsx        # 程序化 SVG 封面系统
│   └── ...                   # Header/Footer/HomeClient/PostClient/TOC/Thinking/…
├── lib/
│   ├── posts.ts              # 文章服务层（含 unstable_cache）
│   ├── i18n.ts               # 161 条中英字典 + Dict 类型
│   ├── madapt.ts             # 移动端数据适配
│   ├── categories.ts         # 分类色板/缩写/标签符号映射
│   ├── relative-time.ts      # 相对时间 + 本地化日期
│   ├── auth.ts / prisma.ts / blob.ts / page-config.ts
│   └── hooks/use-media-query.ts
├── middleware.ts             # /admin兼容跳转＋移动UA改写＋后台鉴权＋强制改密
├── prisma/schema.prisma
└── public/                   # favicon / apple-icon
```

## 关键设计说明

- **容器规范**：前台各区块 `w-full max-w-[min(70%,1600px)] mx-auto px-6` 同线居中（≤1920px 即 70%，超宽屏封顶 1600px）；文章正文 `max-w-5xl`；目录侧栏 308px
- **移动端分流**：`middleware.ts` 内 `MOBILE_UA_RE`（仅手机，不含平板）命中 `/`、`/archive*`、`/posts/*`、`/login` 时 rewrite 到 `/m` 对应页；`view=desktop` cookie 跳过；`/m/*`、`/api/*`、`/dashboard/*` 永不改写
- **分类色板**：`ART_PALETTES`（paper/wash/ink/accent）＋`CAT_ABBR` 缩写，前后台徽标同源
- **日期**：服务端存 ISO，展示层按语言格式化；相对时间 60s 自动刷新

## API 一览

| 方法与路径 | 说明 | 鉴权 |
|------------|------|------|
| `GET /api/posts?q=&status=` | 文章列表（无 `content` 字段） | 公开（未登录仅 published） |
| `POST /api/posts` | 新建 | 登录 |
| `GET/PUT/DELETE /api/posts/[id]` | 详情/更新/删除 | GET 公开 published，其余登录 |
| `GET/POST /api/categories`、`DELETE /api/categories/[id]` | 分类 | 读公开，写登录 |
| `GET/POST /api/thoughts`、`DELETE /api/thoughts/[id]` | 随想 | 读公开，写登录 |
| `GET/POST/DELETE /api/media` | 媒体（Blob） | 登录 |
| `GET/PUT /api/settings` | 设置 | 登录 |
| `/api/auth/*` | NextAuth（登录/改密/状态） | — |

## 部署

### Vercel（推荐，Git 推送自动部署）
1. Fork 本仓库到 GitHub，在 Vercel 导入项目
2. 配置上表全部环境变量
3. `git push origin main` 即触发生产构建（`prisma generate && next build`，36 页静态化）

### Cloudflare Workers 代理（中国大陆访问）
Vercel 默认域名在大陆可能无法访问，可用 Workers 代理：
```bash
npm install -g wrangler
wrangler login
wrangler deploy
```

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 0.2.0 | 2026-09 | 移动端独立版（/m＋轻量后台）＋后台性能优化（API瘦身/缓存/骨架屏）＋全站i18n补齐＋阅读页彩色字＋next/font自托管 |
| 0.1.x | 2026-08 | 文章封面系统、Footer、随想优化、升级 Next.js 15.4.11（安全漏洞修复） |
| 0.1.0 | 2026-08 | 初始版本：Prisma 后台＋安全加固＋Tiptap 编辑器＋强制改密 |

## 许可

MIT License

---

*Built with Next.js, Tailwind CSS, and lots of ☕*
