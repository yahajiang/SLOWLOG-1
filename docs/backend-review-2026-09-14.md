# 后端专项审查（2026-09-14）

> 范围：14 个 API 路由 · 鉴权层 · Prisma/Neon 数据层 · Vercel Blob 媒体 · 缓存策略 · 安全面
> 方式：逐文件证据审查（未改码）· 结论按严重度分级

## 架构概览

NextAuth Credentials（bcrypt 12）+ Prisma Client（Neon，pg 适配器，连接池 max=5）+ unstable_cache（revalidate 60 / tags posts / 发布即 revalidateTag 联动）+ Vercel Blob（上传服务端重压缩）+ middleware 边缘守卫（UA 路由 / view cookie / 改密拦截）。

## 安全面结论（重点）

| 检查项 | 结论 |
|---|---|
| 鉴权覆盖 | **11/11 业务路由** `auth()` + `passwordChangeRequired` 双闸；GET posts 草稿 **404 掩护**（不暴露存在性）✓ |
| 写操作输入 | settings 白名单字段 / posts 显式字段赋值 / tags 清洗（trim+filter）✓ |
| 文件上传 | MIME 白名单（JPEG/PNG/WebP/GIF）+ 5MB 上限 + **服务端重压缩**（MIME 伪造无实质危害）✓ |
| 注入 | Prisma 全参数化；裸 SQL 仅 1 处（health 常量 `SELECT 1`，tagged 模板无插值）✓ |
| 密码存储 | bcrypt 12 + 默认账户检测 + 强制改密闸 ✓ |
| check-default | 需会话，未登录返回 false——不向匿名者泄漏安全态势 ✓ |
| 降级设计 | search-index DB 不可达→空索引 / health 503 分级 / 错误透明化（media 返回具体原因）✓ |
| 缓存一致性 | revalidateTag("posts") + 路由再生（首页/RSS/sitemap/详情 id+slug）联动 ✓ |
| 定时发布 | publishedAt 惰性过滤（查询期判定），无 cron 依赖 ✓ |

## 发现（按严重度）

| 级别 | 发现 | 建议 |
|---|---|---|
| **P1-1** | **登录无限流**：`authorize` 直接 bcrypt 比对，公网可无限暴力尝试 admin 端点 | 内存/IP 滑动窗口（如 5 次/15 分钟，登出清零）；单人博客低风险但值得做（~40 行） |
| P2-1 | Prisma 连接 `ssl: { rejectUnauthorized: false }`——TLS 不验证书（理论 MITM） | 改用 Neon CA 或 `rejectUnauthorized: true` 验证连通 |
| P2-2 | change-password / auth/update **不验旧密码**（持会话即可改密） | 可选：加 current password 字段；单人博客可接受 |
| P2-3 | media `filename = Date.now()-${file.name}` 未清洗即拼 Blob key | Vercel Blob 会规范化 key，风险低；可选白名单清洗 |
| P3 | POST 输入无类型校验（title 传 number → Prisma 500）；slug 冲突返回 500 而非 409（P2002 未单独捕获）；settings GET 带创建副作用；health 暴露 blob 配置状态 | 逐项小改，可选 |

## 良好实践（点名表扬）

- 草稿 404 掩护（不暴露草稿存在性）
- 惰性 `import("./prisma")`（edge 打包链不带 pg）
- search-index 降级空索引（面板不炸、页面不报错）
- revalidatePostViews 一个函数收口 5 处缓存再生
- 错误透明化（media 失败返回具体原因，不再裸 500）

## 总评

后端安全基线**高于同类个人博客平均水平**：鉴权双闸全覆盖、白名单输入、上传校验、参数化查询、降级设计齐备。唯一值得动手的是 **P1-1 登录限流**；其余按需。

---

# 补充：全维度深审（同日第二轮 · 业务逻辑/契约一致性/数据完整性/安全头）

> 补齐第一轮未覆盖的部分：categories/thoughts/auth-update 完整逻辑 · Prisma 关系与约束 · 错误契约一致性 · 缓存一致性 · 安全响应头

## 新增发现

| 级别 | 发现 | 说明 |
|---|---|---|
| **P2-4** | **SVG 上传直存**：blob.ts 对 `image/svg+xml` 跳过重压缩原样存储——SVG 可内嵌 script，构成存储型 XSS 向量（需管理员权限上传，风险受限） | 缓解：SVG `content-disposition: attachment` 响应头，或禁 SVG 上传 |
| **P2-5** | **改密端点重复且强度不一**：`auth/update`（bcrypt **10**、无密码长度校验）与 `change-password`（bcrypt **12**、8 位校验）功能重叠 | 收敛为单一端点，统一 bcrypt 12 + 校验 |
| **P3-1** | categories **PUT/DELETE 缺 `revalidateTag("categories")`**（POST 有）——改名/删除后分类缓存 60s 旧值 | 各 1 行补齐 |
| P3-2 | 安全响应头：HSTS ✓ / nosniff ✓ / X-Frame DENY ✓，**缺 CSP 与 Referrer-Policy** | next.config headers 补 2 行 |
| P3-3 | 错误文案语言混杂（settings 中文 / thoughts 英文 / posts 混合） | 统一错误文案来源 |
| P3-4 | auth/update 改邮箱后 session.email 与 DB 脱钩（前端引导重登 ✓ 可接受） | 维持现状 |

## 数据完整性（schema 实查）

- `email @unique`、Post/Category `slug @unique` ✓
- `Post @@index([status])`——前台 status 查询走索引 ✓
- Category 删除有**应用层引用保护**（有文章拒删，明确错误信息）✓

## 契约一致性

- 错误格式统一 `{ error: string }` ✓，状态码使用规范（401/403/404/400/500）基本一致 ✓
- **不一致点**：posts PUT 的 slug 冲突未捕获 P2002（categories PUT 已捕获 400）——同一仓两种深度

## 良好实践（补充点名）

- blob.ts **三级降级写入链**（Blob → 本地 public/uploads → data URI），putLocal 有文件名清洗（路径穿越防护 ✓）
- post-versions.ts：版本历史存 localStorage（零迁移零后端，单人博客最优解）
- next.config：lucide modularizeImports / avif+webp / 静态资源 immutable 长缓存 / bundle-analyzer
- thoughts POST 缓存联动完整（revalidateTag + / + /m）

## 修复优先级汇总（两轮合计）

| 优先级 | 项 | 工作量 |
|---|---|---|
| **P1** | 登录限流 | ~40 行 |
| P2 | Prisma TLS 验证 · 改密端点收敛（含旧密码验证）· SVG 缓解 | 各 ~10 行 |
| P3 | categories revalidateTag 补齐 · CSP/Referrer-Policy · 错误文案统一 · 输入校验 | 各 1-5 行 |

