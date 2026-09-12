---
feature: card-cover
status: delivered
updated: 2026-09-11
branch: feat/card-cover
commits: c7dd01f..20422ae
---

# 鍗＄墖灏侀潰瀵归綈 Hero + 寰幆鍔ㄦ晥

## Report

**What was built** — CoverArt 共享封面底盘：大衬线首字母 + 7 分类几何母题 + 底栏编号；wide/card 比例；cover-pulse/cover-flow 循环微动效（reduced-motion 可关）。ArticleArt/HeroCover 改薄封装，列表卡与 Hero 同语言。

**Verification** — tsc 无 CoverArt/ArticleArt/HeroCover 错误；截图 mobile-preview/09-card-cover.png 确认 Plugin 卡为字母+方阵而非同心圆刷屏。

**Journey log**
1. 用户看 localhost:3000 时改动在 worktree，未合并——先合 main 再验。
2. 卡片 16/9 与 ArticleCard 包裹一致，避免双裁切。
3. 循环动效复用已有 cover-inner float，仅加 pulse/flow。
## [S1] Problem
鍒楄〃鍗″皝闈㈡棫 TagScene 楂樺害闆峰悓锛涗笌 HeroCover 鏂锛涘皝闈㈤潤鎬侊紝缂哄厠鍒跺惊鐜姩鏁堛€?

## [S2] Design
鎶藉嚭 `components/CoverArt.tsx` 鍏变韩搴曠洏锛?

- 鏋勫浘锛氳壊绾?`art-*`銆佽交绾哥汗銆佸法琛嚎棣栧瓧姣嶏紙宸︼級銆佸垎绫诲嚑浣曟瘝棰橈紙鍙筹級銆佸簳鏍?`ABBR 路 noNum 路 TAG`
- Props: `{ post, ratio?: "wide"|"card", noBorder?, className? }`
  - wide = 16/10锛圚ero锛夛紱card = 16/9锛堝垪琛ㄥ崱锛屼笌 ArticleCard 鍖呰９涓€鑷达級
- **寰幆鍔ㄧ敾锛堝厠鍒讹級**锛?
  - 涓讳綋/瀛楁瘝瀹瑰櫒 `cover-inner`锛?s 鏋佽交涓婃诞 -2px锛屽凡鏈?keyframe锛?
  - 寮鸿皟鑹茬偣 `cover-pulse` 3.2s 鍛煎惛锛坥pacity/scale锛?
  - 绛夐珮绾?铏氱嚎 `cover-draw` 鍏ュ満鎻忕嚎 + 鏋佹參 stroke 娴佸姩
  - `prefers-reduced-motion` 鏃跺叏閮ㄥ仠鐢?
- `HeroCover` / `ArticleArt` 鏀逛负钖勫皝瑁咃紝API 鍏煎

## [S3] Out of Scope
鍒?ArticleArt 瀵煎嚭銆佹枃妗堝尯銆佹殫鑹?token銆?

## Tasks
- [ ] T1: CoverArt + 寰幆鍔ㄦ晥 鈥?楠屾敹锛歸ide/card 鍙覆鏌擄紝鍔ㄦ晥 reduced-motion 瀹夊叏 (covers: S2)
- [ ] T2: 钖勫皝瑁呮帴鍏?鈥?楠屾敹锛欻ero/鍒楄〃鍗℃棤 TagScene锛屽崱鐗?16/9 (covers: S2; depends: T1)
- [ ] T3: tsc + 鎴浘 鈥?楠屾敹锛氬鍒嗙被鍗＄墖鏋勫浘鏈夊樊寮?(covers: S2; depends: T1,T2)

