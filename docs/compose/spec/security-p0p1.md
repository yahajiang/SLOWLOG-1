---
feature: security-p0p1
status: delivered
updated: 2026-09-10
branch: fix/security-p0p1
commits: 442acb1..97228b9
---

# Security & Correctness P0/P1

## Report

**What was built** — 三块安全/正确性修复合入 `fix/security-p0p1`：

1. **Site origin 白名单**：新增 `lib/site-url.ts`，origin 只来自 `NEXT_PUBLIC_SITE_URL`，不读 Host/X-Forwarded-Host。RSS、sitemap、桌面/移动 metadata、JSON-LD、OG 底栏全部接入；删除硬编码 `yahajiang.dpdns.org`。
2. **强制改密闭环**：middleware matcher 覆盖 `/m/dashboard/:path*`；默认密码会话被导向 `/dashboard/change-password`；`/m/dashboard` layout 二次拦截；posts/categories/thoughts/media/settings 全部写 API 返回 403。
3. **命名与卫生**：`posts` 缓存 key 改为语义名；`scripts/qa-screens/` 进 gitignore。

**Verification** — `npx tsc --noEmit` PASS（exit 0）。独立 review：APPROVE，无 ship-blocking 缺陷。

**Journey log**
- 原 WIP 把 origin 改成「请求头优先」会引入 Host 注入；方向（统一真相源）对，实现反转为 env-only。
- 缓存键「污染」经核实 Next.js `unstable_cache` 会把实参并入 key，并非真 bug，只做命名澄清。
- 桌面 dashboard layout 若对 `needsPasswordChange` 做 redirect，会与改密页死循环——强制改密只能放 middleware（并排除 change-password）。
- `/api/auth/update` 仍无 403 守卫（可改自己密码，非内容写），review 标为 non-blocking follow-up。

## [S1] Problem

1. **Host header injection（P0）**：若站点 origin 从 `x-forwarded-host`/`host` 解析，攻击者可伪造 Host，使 RSS / sitemap / canonical / JSON-LD 输出恶意外域 → SEO 投毒与钓鱼链接。
2. **强制改密绕过（P0）**：middleware 只保护 `/dashboard`，matcher 不含 `/m/dashboard/*`；`/m/dashboard` layout 只查 session 不查 `needsPasswordChange`。默认账户 `admin123` 可在手机后台完整操作。
3. **缓存键命名误导（P1 降级）**：`getCachedPostRows` key 写死 `["posts-all"]`。核实 Next.js `unstable_cache` 会把函数实参并入 key，**无 draft 污染 published 的实际漏洞**；仅将 key 名改为语义正确的 `posts-by-status`。
4. **OG 域名硬编码（P1）**：`opengraph-image.tsx` 写死 `yahajiang.dpdns.org`，与统一 origin 真相源脱节。

## [S2] Design

### S2.1 Site origin 唯一真相源

- `lib/site-url.ts` 导出 `getSiteUrl()` / `getSiteUrlSync()` / `getSiteHost()`。
- **只信任** `NEXT_PUBLIC_SITE_URL`；未配置或仍是 `https://example.com` 占位时回退 `https://example.com`。
- **不读取**请求头 Host / X-Forwarded-Host 作为 origin（防注入）。换域名 = 改 env + 重新部署。
- 调用方：rss.xml、sitemap、桌面/移动 metadata、文章 JSON-LD、OG 图底栏域名。

### S2.2 强制改密闭环

- middleware `matcher` 增加 `/m/dashboard/:path*`。
- 未登录：`/dashboard*` → `/login`；`/m/dashboard*` → `/m/login`。
- `needsPasswordChange`：桌面/移动 → `/dashboard/change-password`；桌面 layout 不做二次 redirect（防死循环）。
- 写 API：auth 后若 `needsPasswordChange` 则 403。

### S2.3 缓存键

- key 名改为 `posts-by-status`（澄清语义）。实参本就参与 cache key，无行为变更。

### S2.4 范围边界

- 不引入 Setting 表存 origin。
- 不新建移动改密页。
- 不重做 hero 分类 spotlight。

## [S3] Out of Scope

- 桌面/移动 hero 逻辑抽取
- 类型 `any` 全面清理
- 测试框架选型与全量用例
- 默认密码 seed 随机化

## Tasks

- [x] T1: 重写 `lib/site-url.ts` 为 env 白名单实现 — acceptance: 不读取任何 request header；有 env 用 env，否则 FALLBACK (covers: S2.1)
- [x] T2: RSS / sitemap / 各页 metadata / JSON-LD / OG 底栏接入 getSiteUrl — acceptance: 仓库内不再出现手写 `NEXT_PUBLIC_SITE_URL` 拼 canonical 与硬编码 dpdns 域名 (covers: S2.1; depends: T1)
- [x] T3: middleware + `/m/dashboard` layout + 写 API 强制改密 — acceptance: matcher 含 `/m/dashboard`；默认密码会话无法写 API、无法使用移动后台 (covers: S2.2)
- [x] T4: 修正 `getCachedPostRows` 缓存键命名 — acceptance: key 名为 posts-by-status (covers: S2.3)
- [x] T5: `.gitignore` 增加 `scripts/qa-screens/` — acceptance: 截图产物不被 track (covers: S2.4)
- [x] T6: 本地 typecheck — acceptance: `npx tsc --noEmit` 通过 (covers: S2.1–S2.3)
