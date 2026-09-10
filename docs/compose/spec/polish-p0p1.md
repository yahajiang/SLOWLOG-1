---
feature: polish-p0p1
status: designed
updated: 2026-09-10
branch: feat/polish-p0p1
commits:  # filled at delivery
---

# SLOWLOG P0+P1 精修（层级 / 减法 / 阅读）

## Report

## [S1] Problem

网站完成度高，但视觉信息密度偏高：封面微字过密、首页模块抢注意力、卡片与文章头区元信息过重、正文默认过宽。需要在不改风格定位的前提下做收敛与阅读体验优化。

## [S2] Design

### S2.1 封面微字弱化
- `ArticleArt` 全部微装饰文字：`opacity` 上限 0.35，字号下限不小于 6px；删除无信息量的纯数字串（如 `00 — 04 — 08`、`16 · 24 · 40`）可降为装饰点/线，不保留随机数字。
- 保留：分类缩写 `abbr`、`No.{n}` 编号、场景符号（⬢ 等）作为版式气质，但透明度统一弱化。

### S2.2 首页层级
- Hero 与列表加大反差：Hero 区上/下 padding 增加；列表卡片更紧凑（封面 aspect 不变，文案区 padding 收紧）。
- 模块顺序保持：Hero → 列表/分类 Section →（仅 All）随想/时间线 → Footer。
- 不删模块；分类 spotlight WIP 已合入为基线。

### S2.3 卡片信息层级
- `ArticleCard` / `MArticleCard`：去掉 `AuthorAvatar`；标签最多 1 个且无边框弱化；保留 分类徽章（封面上）+ 标题 + 摘要 + `相对时间 · 阅读时长`。

### S2.4 文章头区
- 去掉厚重作者卡容器；改为一行 meta：`作者 · 日期 · 分类 · 时长`；标签最多 3 个、弱化样式。
- 引言块保留但左右 padding 略减。

### S2.5 正文宽度
- 默认 `max-w-5xl` → `max-w-3xl`（约 768px）；`pageConfig.maxWidth` narrow/wide 仍覆盖。

### S2.6 代码块
- 补充行号列（等宽、opacity 弱化）；保留现有 语言徽章 + 复制 + 横滚。

### S2.7 相关推荐
- 排序：同分类∩同标签数 > 同分类 > 同标签数 > 最新；最多 3 篇；排除当前文。

### S2.8 移动端清单
- Header 拥挤：压缩非必要间距。
- 分类条：已有横滑+渐隐，验证归档钮不挤压。
- 卡片：同步 S2.3。
- 标题断行：`text-balance` / 合理 `leading`。
- TOC：抽屉不常驻遮挡。
- 代码：横滚已有。
- 图片：不超出（`max-w-full`）。

### S2.9 阅读进度 / 时间线
- 阅读进度条视觉再弱化（高度/对比）。
- 时间线以 年 → 月 → 标题 为主，减少元数据堆叠（已较克制则只微调）。

## [S3] Out of Scope

- 封面手动指定字段
- Ctrl/Cmd+K 搜索
- 评论/点赞/用户系统
- 新增颜色或大量动画
- SEO/P2 性能大项（另轮）

## Tasks

- [ ] T1: 合入 WIP 基线 — acceptance: hero spotlight + OG 调色板在分支上 (covers: S2.2)
- [ ] T2: ArticleArt 微字弱化 — acceptance: 微文字 opacity≤0.35，无随机数字噪声 (covers: S2.1)
- [ ] T3: 卡片减信息（桌面+移动） — acceptance: 无作者头像；标签≤1 弱化 (covers: S2.3)
- [ ] T4: 首页 Hero/列表反差 — acceptance: Hero 留白明显大于列表；结构不变 (covers: S2.2)
- [ ] T5: 文章头区一行 meta — acceptance: 无作者卡底；标签≤3 (covers: S2.4)
- [ ] T6: 正文默认 max-w-3xl — acceptance: 默认文章列约 768px (covers: S2.5)
- [ ] T7: 代码块行号 — acceptance: pre 旁有行号且复制仍可用 (covers: S2.6)
- [ ] T8: 相关推荐标签加权 — acceptance: 同分类+标签重合优先 (covers: S2.7)
- [ ] T9: 移动端七项检查修 — acceptance: 清单项在 M* 组件落实 (covers: S2.8)
- [ ] T10: 阅读进度弱化 — acceptance: 进度条不抢主视觉 (covers: S2.9)
- [ ] T11: typecheck — acceptance: `npx tsc --noEmit` 通过 (covers: S2.1–S2.9)
