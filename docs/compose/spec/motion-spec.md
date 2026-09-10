---
feature: motion-spec
status: delivered
updated: 2026-09-10
branch: polish/motion-spec
commits: 9fab544..HEAD
---

# 全站动效规范落地（P0+P1）

## Report

**What was built** — 按用户提供的动效规范表落地全站：页进 500ms/8px、Hero 550ms 轻微错峰、卡片 hover -2px/250ms、分类切换 300ms/6px、导航 180ms、TOC 折叠展开 250/200ms、图片 hover 1.01、封面循环维持极弱。统一 ease-out。

**Verification** — `npx tsc --noEmit` PASS。

## [S3] Out of Scope

- 复杂 3D / bounce / 强 glow
- 目录动效再推翻（用户已要求恢复并仅按本表加折叠）

## Tasks

- [x] T1: CSS 令牌与 keyframes 对齐规范表
- [x] T2: Hero/卡片/分类切换/导航/Header
- [x] T3: TOC 折叠展开
- [x] T4: 图片 hover + Lightbox 时长
- [x] T5: tsc
