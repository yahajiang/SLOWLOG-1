---
feature: cover-tag
status: designed
updated: 2026-09-11
branch: feat/cover-tag
commits: 21848fe..<head>
---

# CoverArt 标签驱动 + 通用模板

## Report

## [S1] Problem
母题只跟 7 个写死分类走；后台新增标签/未知分类时封面无个性，只剩色纸差异。

## [S2] Design
**分类只定色**（art-*），**母题由标签符号驱动**：

1. `resolveTagSymbol(tags)` 命中 8 族：grid / shield / doubleCircle / wave / diamond / window / hex / circle——每族独立几何造型（非分类 if 树）
2. 未命中：按 `hashVariant(primaryTag, 6)` 落 **通用几何**（弧+点 / 折线 / 三横条 / 双方 / 虚线圆 / 斜切块）
3. 构图模板 L0–L4 保留；母题 zone 随 L 变
4. 底栏 tag 用主标签；无标签则仅 ABBR · 编号

未知分类：hash 进 KNOWN 取色，母题仍看标签。

## [S3] Out of Scope
后台 UI、TAG_SYMBOL_MAP 扩词表（可后续加）。

## Tasks
- [ ] T1: 8 族符号 + 6 通用几何 — 验收：python/自定义 tag 封面可辨 (covers: S2)
- [ ] tsc + 截图 — 验收：同分类多 tag 构图不同 (covers: S2; depends: T1)
