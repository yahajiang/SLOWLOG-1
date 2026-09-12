---
feature: hero-cover
status: delivered
updated: 2026-09-11
branch: feat/hero-cover
commits: 5658a43..687a338
---

# HeroCover：推荐封面重写

## Report

**What was built** — 新建独立 `components/HeroCover.tsx` 专供首页推荐位：16/10、巨衬线首字母（左）+ 7 分类几何母题（右）+ 底栏一行 `ABBR · 编号 · TAG`。无 TagScene / PluginSymbol。桌面 `HomeClient` 与移动 `MHome` Hero 接入；列表卡仍走 `ArticleArt`。

**Verification** — `npx tsc --noEmit` 无 HeroCover/HomeClient/MHome 错误；截图 `mobile-preview/08-hero-cover.png`；Review C1（桌面双边框）已修 `noBorder`。

**Journey log**
1. 推荐位原是 `ArticleArt tall` 缩略图，与卡片封面争同一套装饰语言。
2. 独立 HeroCover 后 `ArticleArt` 的 `tall` 路径闲置，可后续清理。
3. 外层已有 border 时必须 `noBorder`——MHome 对了、HomeClient 漏了。
4. 字母与几何母题必须分侧，否则同 variant 右侧重叠。

## [S1] Problem
Hero 侧栏封面复用 ArticleArt tall，小尺寸下主体不清。

## [S2] Design
独立 HeroCover：大字+分类几何；色纸 art-* 令牌；底栏一行；HomeClient/MHome 接入。

## [S3] Out of Scope
ArticleArt 非 tall、暗色 token、Hero 轮播文案。

## Tasks
- [x] T1: HeroCover 底盘 + 7 母题 (covers: S2)
- [x] T2: 接入桌面/移动 Hero (covers: S2; depends: T1)
- [x] T3: tsc + 截图验证 (covers: S2; depends: T1,T2)
