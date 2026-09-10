---
feature: security-p0p1
status: designed
updated: 2026-09-10
branch: fix/security-p0p1
commits:  # filled at delivery
---

# Security & Correctness P0/P1

## Report

## [S1] Problem

1. **Host header injection（P0）**：若站点 origin 从 `x-forwarded-host`/`host` 解析，攻击者可伪造 Host，使 RSS / sitemap / canonical / JSON-LD 输出恶意外域 → SEO 投毒与钓鱼链接。
2. **强制改密绕过（P0）**：middleware 只保护 `/dashboard`，matcher 不含 `/m/dashboard/*`；`/m/dashboard` layout 只查 session 不查 `needsPasswordChange`。默认账户 `admin123` 可在手机后台完整操作。
3. **缓存键命名误导（P1 降级）**：`getCachedPostRows` key 写死 `["posts-all"]`。核实 Next.js `unstable_cache` 会把函数实参并入 key，**无 draft 污染 published 的实际漏洞**；仅将 key 名改为语义正确的 `posts-by-status`。
4. **OG 域名硬编码（P1）**：`opengraph-image.tsx` 写死 `yahajiang.dpdns.org`，与统一 origin 真相源脱节。

## [S2] Design

### S2.1 Site origin 唯一真相源

- `lib/site-url.ts` 导出 `getSiteUrl()` / `getSiteUrlSync()`。
- **只信任** `NEXT_PUBLIC_SITE_URL`；未配置或仍是 `https://example.com` 占位时回退 `https://example.com`。
- **不读取**请求头 Host / X-Forwarded-Host 作为 origin（防注入）。换域名 = 改 env + 重新部署，这是正确 SEO 行为（canonical 永远指向首选域）。
- 调用方：rss.xml、sitemap、桌面/移动 metadata、文章 JSON-LD、OG 图底栏域名（展示用 host，不含协议）。

### S2.2 强制改密闭环

- middleware `matcher` 增加 `/m/dashboard/:path*`。
- 未登录：`/dashboard*` → `/login`；`/m/dashboard*` → `/m/login`。
- `needsPasswordChange`：桌面/移动 → `/dashboard/change-password`（移动无改密页）；桌面 layout 不做二次 redirect（改密页在 layout 内会死循环），由 middleware 保证排除 change-password。
- 所有写 API（POST/PUT/DELETE）：auth 后若 `needsPasswordChange` 则 403，响应体提示先改密。

### S2.3 缓存键

- key 名改为 `posts-by-status`（澄清语义）。实参本就参与 cache key，无行为变更。

### S2.4 范围边界

- 不引入 Setting 表存 origin（后续可选）。
- 不新建移动改密页。
- 不重做 hero 分类 spotlight（产品改动，另 commit / 另 PR）。

## [S3] Out of Scope

- 桌面/移动 hero 逻辑抽取
- 类型 `any` 全面清理
- 测试框架选型与全量用例（仅对本次修复写最小回归测试若时间允许）
- 默认密码 seed 随机化

## Tasks

- [x] T1: 重写 `lib/site-url.ts` 为 env 白名单实现 — acceptance: 不读取任何 request header；有 env 用 env，否则 FALLBACK (covers: S2.1)
- [x] T2: RSS / sitemap / 各页 metadata / JSON-LD / OG 底栏接入 getSiteUrl — acceptance: 仓库内不再出现手写 `NEXT_PUBLIC_SITE_URL` 拼 canonical 与硬编码 dpdns 域名 (covers: S2.1; depends: T1)
- [x] T3: middleware + `/m/dashboard` layout + 写 API 强制改密 — acceptance: matcher 含 `/m/dashboard`；默认密码会话无法写 API、无法使用移动后台 (covers: S2.2)
- [x] T4: 修正 `getCachedPostRows` 缓存键命名 — acceptance: key 名为 posts-by-status (covers: S2.3)
- [x] T5: `.gitignore` 增加 `scripts/qa-screens/` — acceptance: 截图产物不被 track (covers: S2.4)
- [ ] T6: 本地 typecheck/build 验证 — acceptance: `npx tsc --noEmit` 或 `npm run build` 通过 (covers: S2.1–S2.3)
