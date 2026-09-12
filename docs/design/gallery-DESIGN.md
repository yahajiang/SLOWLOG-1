# DESIGN.md — 慢日志 UI 组件画廊

> 与主站 `app/globals.css` + 组件树同源；本文件只服务 `/design/gallery.html`。

## Identity
Editorial Web Designer — 画廊是「设计契约的展品柜」，不是营销落地页。

## Objective
让访客 10 秒内看懂慢日志设计语言，并把任意组件的提示词复制给 AI 生成同源 UI。

## Visual Foundations
- 纸底 `--yh-bg #fefdfa` / 暗 `#14110d`；墨 `--yh-text`；静音 `--yh-muted`；线 `--yh-border`；点缀 `--yh-accent`
- 直角、1px 边、无圆角卡片；serif 标题（Cormorant + Noto Serif SC）；sans 正文（Plus Jakarta）；mono 元数据（JetBrains，tracking .14em）
- 封面预览必须演示 **CoverArt 语义**：淡入 + cover-sway 轻摆（循环关键帧不写死 opacity）、无大色块、标签签名章 + mono 代号

## Structure
1. sticky 头（S 圆印 + 标题 + 搜索主题）
2. 搜索 + 分类 tabs + 计数
3. 组件网格（预览区 150px + 标签/名/两行描述）
4. 模态：预览 + 可复制提示词（P_BASE + 条目专属）

## Decision Trace
- 封面条目从旧 ArticleArt 改为 CoverArt/HeroCover —— 主站已切换，画廊不同步则误导 AI
- 增加移动组件组 —— /m 平行树已落地，画廊缺则契约不完整
- 动效契约：淡入 + cover-sway translateY；循环关键帧禁止写死 opacity:1（会把淡线拉黑）

## Anti-Patterns
- 禁紫蓝渐变 hero、圆角阴影卡、emoji 标题、假数据百分比三联
- 禁在预览里塞与主站不符的重色块

## Workflow
改主站组件后同步画廊条目与 About「近期落地」；提示词以真源路径为准。
