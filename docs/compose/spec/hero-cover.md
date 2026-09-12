---
feature: hero-cover
status: designed
updated: 2026-09-11
branch: feat/hero-cover
commits: 5658a43..<head>
---

# HeroCover：推荐封面重写

## Report

## [S1] Problem
首页推荐（Hero）侧栏封面复用 `ArticleArt tall`，在 16:10 小尺寸里塞 TagScene + 角标 + 分类装饰，主体不清、辨识度弱，与左侧大标题失衡。

## [S2] Design
新建独立组件 `components/HeroCover.tsx`，**只服务 tall 推荐位**；列表卡/文章页继续用 `ArticleArt`（不改）。

### 底盘（全分类共用）
- 比例 `aspect-[16/10]`；外框可选 `noBorder`；色令牌 `art-{分类}` 的 paper/ink/wash/accent
- 轻纸纹（opacity ≤0.08）
- **无 TagScene、无 PluginSymbol 角标**
- 底栏一行 mono：`{ABBR} · {noNum} · {TAG}`（剥 `[]`）
- 主体安全区：H 12–88% × V 12–72%；底栏独占 V 78–95%

### 构图公式（大字 + 几何）
- 巨衬线首字母（title 首字），按 variant 左/右偏移，opacity ~0.28–0.4
- 每分类 **一套几何母题**（构图各自，色纸共用）：

| 分类 | 几何母题 |
|------|----------|
| Design | 左栏竖发丝线 + 右侧双层色方 |
| Plugin | 2×2 方阵（一角实心）+ 中心点 |
| Engineering | 折线等高 + 节点圆 |
| Typography | 三条基线 + 字号括号 |
| Frontend | 简化窗口 chrome（三点+条） |
| Snippet | 代码槽竖线 + 行点 |
| Life | 同心圆弧 + 点 |

### 接入
- `HomeClient` / `MHome` 的 Hero 侧栏：`ArticleArt tall` → `HeroCover`
- Props: `{ post, noBorder?, className? }`；内部仍用 `hashVariant` 确定 variant

## [S3] Out of Scope
- `ArticleArt` 非 tall 路径、TagScene、Engineering 分区
- 暗色 token 改动（沿用 CSS 变量）
- Hero 轮播/文案布局

## Tasks
- [ ] T1: HeroCover 底盘 + 7 分类母题 — 验收：组件可独立渲染，无 TagScene，底栏一行 (covers: S2)
- [ ] T2: 接入桌面/移动 Hero — 验收：HomeClient 与 MHome 推荐位使用 HeroCover，其它封面未改 (covers: S2; depends: T1)
- [ ] T3: 验证 — tsc 无 HeroCover 错误；截图确认推荐封面新构图 (covers: S2; depends: T1,T2)
