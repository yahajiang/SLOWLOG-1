---
feature: cover-draw
status: designed
updated: 2026-09-11
branch: feat/cover-draw
commits: d29f149..<head>
---

# CoverArt 描线入场 + 呼吸循环

## Report

## [S1] Problem
封面母题一上来就静止/过快出现，缺「缓慢画出来」再接生命力的过程。

## [S2] Design
- **描线入场**：SVG stroke `stroke-dashoffset` 280→0，1.6s `cubic-bezier(0.22,1,0.36,1)`
- **呼吸循环**：描线约 1.4s 后，符号根节点 `.cover-breathe`（scale 1↔1.03 / opacity 1↔0.88，5.2s）；实心块同规则
- 强调点 `cover-pulse`、虚线 `cover-flow` 保留
- `prefers-reduced-motion`：全部 animation none，stroke 立即完整

## [S3] Out of Scope
IntersectionObserver 懒播（仍首屏即播）。

## Tasks
- [ ] T1: CSS 序列 + Motif 挂 cover-breathe — 验收：先描线后呼吸 (covers: S2)
- [ ] tsc — 验收：无 CoverArt 错误 (covers: S2; depends: T1)
