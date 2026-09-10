---
feature: polish-motion
status: delivered
updated: 2026-09-10
branch: polish/motion
commits: c50fa75..HEAD
---

# 全站动效精修（克制 × 生命力）

## Report

**What was built** — 动效气质取「克制纸感」与「保留品牌生命力」的交集：spring 过冲 1.56→1.35，位移/时长令牌化（180/320/480ms），封面呼吸保留但浮动/pulse 收敛；卡片改视口触发 `Reveal` stagger；文章头 meta 去重（readTime 三处→一处）；Toast/Thinking/TOC 点击滚动同步收紧；reduced-motion 覆盖 `data-reveal` 与 JS smooth scroll。

**Verification** — `npx tsc --noEmit` PASS。

## [S2] Design

- Tokens: `--ease-spring` less overshoot; `--duration-fast/normal/slow` 接入 pageIn/封面/hover 关键路径
- `components/Reveal.tsx`：IntersectionObserver + prefers-reduced-motion 直出
- PostClient：顶栏只留 CategoryBadge + 剩余时间 + repo；详情行唯一 readTime
- Toast 位移 16→10px；Thinking 500→320ms

## [S3] Out of Scope

- 后台全量逐控件微调；新增装饰动画；SPA 级路由过渡库

## Tasks

- [x] T1: 令牌 + pageIn/封面收敛
- [x] T2: Reveal 视口入场 + ArticleCard
- [x] T3: PostClient meta 去重
- [x] T4: Toast/Thinking/reduced-motion 滚动
- [x] T5: tsc PASS
