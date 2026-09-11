---
feature: cover-eng-zones
status: designed
updated: 2026-09-11
branch: feat/cover-eng-zones
commits: 270b553..<head>
---

# Engineering 封面分区避让

## Report

## [S1] Problem
Tauri 打印助手等 Engineering 文章封面（`ArticleArt`）多层装饰叠在一起：中心 TagScene 大符号、PluginSymbol 角标、Engineering 装饰 SVG、底栏编号与 tag 芯片互相遮挡。小尺寸卡片上更明显，主次不清。

## [S2] Design
仅改 **Engineering** 分族，其它分类不动。杂志编辑感三层分区：

1. **中心主体区** — TagScene 居中偏下，约占高度 55%，是唯一视觉焦点。
2. **单角标** — PluginSymbol 只保留一处，四象限中选不与 TagScene/底栏冲突的角（默认右上或右下）；去掉与主体重复的小装饰方块。
3. **底栏一行** — `ENG · {noNum} · {PRIMARY_TAG}` 一行 mono；去掉盖在主体上的 `[TAURI]` 独立芯片；装饰线仍在底栏上方。
4. **装饰降噪** — Engineering 各 variant3 的 SVG/网格/角框 opacity ≤ 0.15，且不得进入中心主体安全区（水平 15%–85%，垂直 20%–75%）。

不变式：TagScene 存在时不得有第二枚 PluginSymbol；底栏文字不得被绝对定位元素覆盖。

## [S3] Out of Scope
- Design / Plugin / Frontend / Typography / Snippet / Life 分类
- TagScene 造型本身
- 暗色 token（已有 CSS 变量）
- 移动端布局（封面组件共用，本改只动 Engineering 内层）

## Tasks
- [ ] T1: Engineering 分区结构 — 重排 catName==="Engineering" 分支：中心 TagScene 优先、单角标、底栏一行合并 tag；验收：无元素盖住 TagScene 主体与底栏文字 (covers: S2)
- [ ] T2: 装饰降噪 — 各 variant3 装饰 SVG/网格 opacity≤0.15 且避开中心安全区；验收：截图/代码审查无高对比装饰压主体 (covers: S2; depends: T1)
- [ ] T3: 验证 — tsc 通过；对 tauri-react-print-assistant 渲染截图对比无重叠 (covers: S2; depends: T1,T2)
