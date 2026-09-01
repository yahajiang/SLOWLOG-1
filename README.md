# SlowLog 慢日志

> 慢下来，写点值得读的东西。

一个基于 Next.js 15 + Prisma 6 + NextAuth 5 的双语个人博客系统，集成了 Tiptap 富文本编辑器、Vercel Blob 媒体存储和完整的后台管理功能。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| 数据库 | PostgreSQL (Neon) + Prisma 6 |
| 认证 | NextAuth 5 (Credentials + JWT) |
| 编辑器 | Tiptap 3 (18 扩展) |
| 媒体 | Vercel Blob + sharp 压缩 |
| 部署 | Vercel + Cloudflare Workers 代理 |

## 功能特性

### 前台
- 双语文章展示（中/英切换）
- 文章详情页（TOC 目录、阅读进度、图片灯箱）
- 分类筛选与搜索
- 随想时间线
- RSS 订阅 & Sitemap
- 响应式设计

### 后台管理
- Tiptap 富文本编辑器（18 扩展、拖拽图片、自动保存）
- 文章 CRUD（发布/草稿/推荐/复制）
- 分类管理
- 媒体库（上传/压缩/拖拽）
- 随想管理
- 站点设置

### 安全特性
- NextAuth JWT 认证
- Middleware 鉴权保护后台路由
- 默认账户强制改密（JWT 标志 + middleware 拦截）
- API 路由鉴权（GET 公开，POST/PUT/DELETE 需认证）
- 媒体上传 MIME 白名单（仅 JPEG/PNG/WebP/GIF）
- SVG 上传禁止（防存储型 XSS）

## 快速开始

```bash
# 安装依赖
npm install

# 数据库同步
npx prisma db push

# 启动开发服务器
npm run dev
```

### 环境变量

复制 `.env.example` 为 `.env` 并填写：

```bash
# 数据库
DATABASE_URL=postgresql://...

# 认证
AUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# 媒体存储
BLOB_READ_WRITE_TOKEN=vercel-blob-token

# 站点
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

## 项目结构

```
├── app/
│   ├── api/          # API 路由
│   │   ├── auth/     # 认证端点
│   │   ├── posts/    # 文章 CRUD
│   │   ├── categories/
│   │   ├── thoughts/
│   │   ├── media/
│   │   └── settings/
│   ├── dashboard/    # 后台管理页面
│   ├── login/        # 登录页
│   └── posts/        # 文章详情页
├── components/       # React 组件
│   ├── ui/           # UI 基础组件
│   ├── dashboard/    # 后台组件
│   └── editor/       # Tiptap 编辑器
├── lib/              # 核心逻辑
│   ├── auth.ts       # NextAuth 配置
│   ├── prisma.ts     # 数据库连接
│   ├── posts.ts      # 文章服务层
│   └── blob.ts       # 媒体处理
├── prisma/           # 数据库 Schema
└── public/           # 静态资源
```

## 部署

### Vercel

1. Fork 仓库到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 自动部署

### Cloudflare Workers 代理（中国大陆访问）

由于 Vercel 默认域名在中国大陆可能无法访问，可通过 Cloudflare Workers 代理：

```bash
# 安装 wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署 Worker
wrangler deploy
```

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 0.2.0 | 2026-09 | 文章封面优化、Footer 美化、通用封面、随想优化 |
| 0.1.0 | 2026-08 | 初始版本：Prisma 后台 + 安全加固 + 编辑器 + 强制改密 |

## 许可

MIT License

---

*Built with Next.js, Tailwind CSS, and lots of ☕*
