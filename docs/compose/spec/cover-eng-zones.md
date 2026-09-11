---
feature: cover-eng-zones
status: delivered
updated: 2026-09-11
branch: feat/cover-eng-zones
commits: 270b553..70359f7
---

# Engineering 封面分区避让

## Report

**What was built** — Engineering 封面改为杂志分区：TagScene 真正居中（全局补 translate，56%），PluginSymbol 单角标固定右上，底栏一行 `ENG · 编号 · TAG`（剥掉 tag 自带的 `[]`），去掉中心 tag 芯片。各 variant3 装饰压到 ≤15% 透明度，并几何避开中心安全区（顶带限高、架构框缩角、SCALE 移到左上避免与角标叠字）。

**Verification** — `npx tsc --noEmit` 无 ArticleArt 错误（其余为既有 prisma/implicit-any）；DOM dump 文本为 `["3 NODES · 3","◎","ENG · 3081 · TAURI"]`；截图 `mobile-preview/07-eng-cover.png` 确认主体居中、底栏一行、无叠字。Review（general-9）P1/P2 已按建议修完。

**Journey log**
1. TagScene 原 `top-1/2 left-1/2` 缺 translate，主体偏右下——全局修正对所有分类有益。
2. 底栏 `[TAURI]` 是 tag 数据自带方括号，不是第二枚芯片；需 `replace(/[[\]]/g,"")`。
3. 角标 pin 右上后会与 variant3===2 的 SCALE 标签叠字，装饰必须让角。
4. 低透明度不等于不抢戏——装饰在 TagScene 之后绘制，必须几何限高/缩角。

## [S1] Problem
Tauri 打印助手等 Engineering 文章封面多层装饰叠在一起：中心 TagScene、PluginSymbol 角标、装饰 SVG、底栏编号与 tag 互相遮挡。

## [S2] Design
仅 Engineering。三层分区：中心 TagScene 主体；单角标右上；底栏一行 `ENG · noNum · TAG`。装饰 opacity≤0.15 且不进中心安全区（H 15–85% × V 20–75%）。

## [S3] Out of Scope
其它分类、TagScene 造型、暗色 token、移动端壳布局。

## Tasks
- [x] T1: Engineering 分区结构 (covers: S2)
- [x] T2: 装饰降噪与安全区几何 (covers: S2; depends: T1)
- [x] T3: tsc + 截图验证 (covers: S2; depends: T1,T2)
