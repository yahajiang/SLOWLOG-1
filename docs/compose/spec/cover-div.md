---
feature: cover-div
status: designed
updated: 2026-09-11
branch: feat/cover-div
commits: 3d8b7a8..<head>
---

# CoverArt 多元构图

## Report

## [S1] Problem
CoverArt 统一「巨字母左 + 母题右」，同分类（尤其 Plugin）高度重复；巨字母压画面。

## [S2] Design
按 `hashVariant(seed+"L", 5)` 轮换 **5 套构图模板**：

| L | 构图 |
|---|------|
| 0 | 小字母左上 + 母题右中 |
| 1 | 母题左中 + 极小 mono 字母右下 |
| 2 | 无字母·对角几何（线/块/点） |
| 3 | 上横带 wash + 母题右下 + 小字母带内 |
| 4 | 内框 hairline + 母题左下 + 字母角标 |

- 字母最大 `text-3xl`（卡片）/ `text-4xl`（wide），多数模板更小或不用
- 母题仍分类各异；位置/缩放随 L 微变
- 循环动效保留；底栏不变

## [S3] Out of Scope
新分类、删 CoverArt API。

## Tasks
- [ ] T1: 5 模板 + 字号降级 — 验收：同分类多帖 L 不同，无 6rem 巨字 (covers: S2)
- [ ] tsc + 列表截图 — 验收：Plugin 五卡构图可辨差异 (covers: S2; depends: T1)
