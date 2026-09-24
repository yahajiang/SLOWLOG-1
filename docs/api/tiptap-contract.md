# Tiptap 渲染跨端契约（Web ↔ Android App）

> **维护约定**：修改 `components/editor/PostRenderer.tsx`、`lib/posts.ts` 的 `extractHeadings`、
> `lib/page-config.ts` 三白名单或标题算法时，**必须同步更新本文件**。
> App 端（`slowlog-android`）按本文实现全原生渲染；契约文档是三端唯一的同步带。
> 来源：`App123/开发文档.md` §1.3（v2 实施计划）。

## 1. 节点白名单

| type | 渲染语义 |
|------|----------|
| heading | level 白名单 `[1,2,3,4]`，非法 → 2；锚点 id 见 §3；`attrs.textAlign` 非 left 生效 |
| paragraph | 默认字阶（Web 17px/1.9）；serif 模式可选首字下沉；表格内降级 |
| blockquote | 左 accent 细线 + 斜体 |
| codeBlock | 深色窗口风格、语言徽标、行号、一键复制纯 code |
| bulletList / orderedList / listItem | 圆点/数字列表 |
| taskList / taskItem | 只读复选框，`attrs.checked` |
| image | `safeImgSrc` 白名单；懒加载；alt/caption；灯箱 |
| horizontalRule | 分隔线 |
| table / tableRow / tableHeader / tableCell | 横滑容器；表头加粗底色 |
| 未知节点 | 递归渲染 children；无 content 则丢弃 |

## 2. 行内 marks

`bold` · `italic` · `code` · `underline` · `strike` · `textStyle.color`（经 `safeColor`）· `highlight`（经 `safeColor`）· `link`（经 `safeHref`）· `hardBreak`

## 3. Heading id 算法（命脉）

1. **先序遍历**全文档（含引用块/列表内标题），深度上限 **20**。
2. 按文档顺序全局递增序号 `i`（从 0 起）。
3. `slugifyHeading(text, i)`：小写；非 `[\w一-鿿]` → `-`；空则 `heading-{i}`。
4. `dedupeHeadingId`：重名追加 `-1`、`-2`…（与 `lib/headings.ts` 一致）。

服务端 `extractHeadings`（`lib/posts.ts`）与渲染端 headingIds、App 端必须**同序**。

## 4. 三白名单（`lib/page-config.ts`）

- **safeColor**：hex / rgb(a) / hsl(a) / oklch / 命名色；`expression()`/`url()` 等一律过滤。
- **safeHref**：`http`/`https`/`mailto`/`tel`/`#`/`//`；其余降级纯文本。
- **safeImgSrc**：`http(s)`/站内/`data:image/png|jpeg|webp|gif|avif|svg`；其余整图丢弃。

## 5. 安全天花板

| 项 | 值 |
|----|-----|
| 渲染递归深度 | **40**（`MAX_RENDER_DEPTH`） |
| 正文 JSON | schema 层 **≤1MB** |
| heading 遍历深度 | 20 |

## 6. pageConfig

`layout: standard|magazine|fullscreen` · `theme: light|dark|system` · `fontFamily: sans|serif` · `maxWidth: narrow(672)|medium(768)|wide(896)` · `showTOC: boolean` · 颜色经 `safeColor`。

非法枚举回默认；`withSiteDefaults`：与内置默认相等的字段视为未定制，回退站点设置。

## 7. 阅读进度

- 键：`sl-read:{id}`，存最深百分比（**只升不降**）。
- **≥98%** 视为读完，自动清除。
- 首页「继续阅读」：≥5% 且 &lt;95% 时显示提示条。

## 8. 相关文章打分

`同分类×10 + 同标签×3`，按 `publishedAt ?? createdAt` 最新优先，平局 `createdAt`，最多 **3** 篇。

## 9. 列表排序（App 展示契约）

统一按 `publishedAt ?? createdAt desc`，**不依赖** `/api/posts` 默认 `updatedAt desc`。

## 10. 增量同步与封面

- Sync 见 `GET /api/app/sync`；硬删 tombstone 保留窗口 **90 天**，since 超窗 → 400 全量重拉。
- 封面 PNG：`GET /api/covers/[id]?w=800|1600&v=<updatedAt>`；派生规则见 `lib/cover-derive.ts`（FNV-1a 三轴 + 家族色），App 只缓存图片、不重绘。**位图侧只渲染拉丁**（服务端随包字体没有中文字面）：中文标题首字回落为分类首字母、含非 ASCII 的标签段整段丢弃；Web 端 `CoverArt.tsx` 由浏览器排版，中文照常。
