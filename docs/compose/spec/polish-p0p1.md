---
feature: polish-p0p1
status: delivered
updated: 2026-09-10
branch: feat/polish-p0p1
commits: c036283..96c67ff
---

# SLOWLOG P0+P1 精修（层级 / 减法 / 阅读）

## Report

**What was built** — 在不改风格定位的前提下完成 P0+P1 收敛：封面微字全局弱化（opacity≤0.32、SVG 字号≥8、去掉随机数字噪声）；卡片去作者头像、标签≤1 弱化；文章头区厚重作者卡改为一行 meta；正文默认 `max-w-3xl`；首页 Hero 留白加大与列表拉开层级；代码块补行号（复制仍复制纯代码）；相关推荐改为同分类+标签加权；阅读进度 2px/60%；移动卡片与文章头同步桌面减法。既有 hero spotlight + OG 调色板 WIP 已作为基线合入。

**Verification** — `npx tsc --noEmit` PASS。独立 review 首轮 REQUEST_CHANGES（S2.1 SVG 残留），已修复 opacity/字号后 typecheck 再 PASS。

**Journey log**
- 封面微字是品牌气质：只弱化不删除，避免「干净到没性格」。
- 作者卡改一行 meta 后首屏更快进正文；Hero 仍保留作者信息以突出 spotlight。
- 代码行号用 grid gutter，避免污染 clipboard 复制内容。

## [S1] Problem

网站完成度高，但视觉信息密度偏高：封面微字过密、首页模块抢注意力、卡片与文章头区元信息过重、正文默认过宽。需要在不改风格定位的前提下做收敛与阅读体验优化。

## [S2] Design

### S2.1 封面微字弱化
- `ArticleArt` 微装饰文字：opacity ≤0.32；SVG `fontSize`≥8；去掉随机数字噪声。保留 abbr / No. / 场景符号。

### S2.2 首页层级
- Hero `py-12 md:py-16`；列表卡片更紧凑；模块顺序不变；分类 spotlight 保留。

### S2.3 卡片信息层级
- 去 AuthorAvatar；标签≤1 无边框弱化；保留分类徽章+标题+摘要+时间时长。

### S2.4 文章头区
- 一行 meta：作者 · 日期 · 分类 · 时长；标签≤3 弱化。

### S2.5 正文宽度
- 默认 `max-w-3xl`；narrow/wide 仍覆盖。

### S2.6 代码块
- 行号 gutter；保留语言徽章+复制+横滚；复制内容不含行号。

### S2.7 相关推荐
- `sameCat*10 + tagOverlap*3`，再按时间；最多 3 篇。

### S2.8 移动端
- 卡片/文章头与桌面同步；TOC 抽屉；分类条横滑已具备。

### S2.9 阅读进度
- `h-[2px]` + `opacity-60`。

## [S3] Out of Scope

- 封面手动指定、Ctrl+K、评论/点赞、新颜色、大动画、SEO/P2 性能大项

## Tasks

- [x] T1: 合入 WIP 基线
- [x] T2: ArticleArt 微字弱化
- [x] T3: 卡片减信息（桌面+移动）
- [x] T4: 首页 Hero/列表反差
- [x] T5: 文章头区一行 meta
- [x] T6: 正文默认 max-w-3xl
- [x] T7: 代码块行号
- [x] T8: 相关推荐标签加权
- [x] T9: 移动端同步减法
- [x] T10: 阅读进度弱化
- [x] T11: typecheck PASS
