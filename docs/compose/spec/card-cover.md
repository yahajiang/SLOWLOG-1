---
feature: card-cover
status: in-progress
updated: 2026-09-11
branch: feat/card-cover
commits: c7dd01f..<head>
---

# 卡片封面对齐 Hero + 循环动效

## Report

## [S1] Problem
列表卡封面旧 TagScene 高度雷同；与 HeroCover 断裂；封面静态，缺克制循环动效。

## [S2] Design
抽出 `components/CoverArt.tsx` 共享底盘：

- 构图：色纸 `art-*`、轻纸纹、巨衬线首字母（左）、分类几何母题（右）、底栏 `ABBR · noNum · TAG`
- Props: `{ post, ratio?: "wide"|"card", noBorder?, className? }`
  - wide = 16/10（Hero）；card = 16/9（列表卡，与 ArticleCard 包裹一致）
- **循环动画（克制）**：
  - 主体/字母容器 `cover-inner`（8s 极轻上浮 -2px，已有 keyframe）
  - 强调色点 `cover-pulse` 3.2s 呼吸（opacity/scale）
  - 等高线/虚线 `cover-draw` 入场描线 + 极慢 stroke 流动
  - `prefers-reduced-motion` 时全部停用
- `HeroCover` / `ArticleArt` 改为薄封装，API 兼容

## [S3] Out of Scope
删 ArticleArt 导出、文案区、暗色 token。

## Tasks
- [ ] T1: CoverArt + 循环动效 — 验收：wide/card 可渲染，动效 reduced-motion 安全 (covers: S2)
- [ ] T2: 薄封装接入 — 验收：Hero/列表卡无 TagScene，卡片 16/9 (covers: S2; depends: T1)
- [ ] T3: tsc + 截图 — 验收：多分类卡片构图有差异 (covers: S2; depends: T1,T2)
