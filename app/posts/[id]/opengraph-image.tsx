import { ImageResponse } from "next/og"
import { getPostById, getPostBySlug } from "@/lib/posts"
import { ART_PALETTES, CAT_ABBR } from "@/lib/categories"
import { getSiteHost } from "@/lib/site-url"

// OG 分享图：使用类目调色板（与站点封面系统同源），保证社交分享图一眼可识别为「慢日志」风格。
// 中文默认字体 next/og 内置可用，无需额外加载；如需更精细的衬线字体（Noto Serif SC），
// 可在 ImageResponse 的 fonts 选项里加载 Google Fonts 字形子集。
// 注意：URL [id] 可能是 slug（老链接）或 cuid（站内链接），双查兜底。
export const runtime = "nodejs"
export const revalidate = 3600
export const alt = "慢日志 SlowLog"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

function getCategoryName(category: any): string {
  if (typeof category === "string") return category
  if (category && typeof category === "object") return category.name || category.nameZh || "Design"
  return "Design"
}

function breakTitle(t: string): [string, string?] {
  const clean = t.trim()
  if (clean.length <= 16) return [clean]
  // 优先在冒号/破折号/空格处断行，其次靠近中点处硬断（不拆入词的保守策略：中文逐字可断）
  const marks = ["：", "——", "—", "，", " ", "·"]
  for (const m of marks) {
    const i = clean.indexOf(m)
    if (i >= 2 && i < clean.length - 3) return [clean.slice(0, i + 1), clean.slice(i + 1)]
  }
  const mid = Math.ceil(clean.length / 2)
  return [clean.slice(0, mid), clean.slice(mid)]
}

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let post = await getPostBySlug(id).catch(() => null)
  if (!post) post = await getPostById(id).catch(() => null)
  const title = post ? post.titleZh || post.title : "慢日志 SlowLog"
  const catName = getCategoryName(post?.category)
  // 使用类目调色板，与站内 ArticleArt / CategoryBadge 完全同源
  const palette = (ART_PALETTES as any)[catName] || ART_PALETTES.Design
  const abbr = (CAT_ABBR as any)[catName] || catName.slice(0, 3).toUpperCase()
  const date = post?.displayDate || ""
  const readTime = post?.readTime || ""
  const [l1, l2] = breakTitle(title)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "row",
          background: palette.paper, color: palette.ink, padding: 0, position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* 左侧类目色条：用 accent 而非通用紫 */}
        <div style={{ width: 18, height: "100%", display: "flex", background: palette.accent }} />

        {/* 右下角 wash 色块：呼应封面系统的 wash 用法 */}
        <div style={{ position: "absolute", right: 64, bottom: 76, width: 140, height: 140, display: "flex", background: palette.wash }} />

        {/* 主内容列 */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "60px 80px 60px 64px", position: "relative" }}>
          {/* 顶部：品牌行 + 类目徽章 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 9999, background: palette.ink, color: palette.paper, display: "flex", alignItems: "center", justifyContent: "center", fontStyle: "italic", fontSize: 24, transform: "rotate(-3deg)" }}>S</div>
              <div style={{ fontSize: 20, display: "flex", color: palette.ink }}>
                <span style={{ letterSpacing: "0.08em" }}>慢日志</span>
                <span style={{ letterSpacing: "0.16em", fontFamily: "monospace", marginLeft: 8 }}> · SLOWLOG</span>
              </div>
            </div>
            {/* 类目徽章：白底 + ink 色边框 + accent 下划线，与站内 CategoryBadge 视觉对齐 */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18 }}>
              <span style={{ fontFamily: "monospace", letterSpacing: "0.18em", padding: "8px 14px", border: `1.5px solid ${palette.ink}`, color: palette.ink }}>{abbr}</span>
              <span style={{ letterSpacing: "0.06em", color: palette.ink, opacity: 0.65 }}>{catName}</span>
            </div>
          </div>

          {/* 标题块 */}
          <div style={{ display: "flex", flexDirection: "column", marginTop: 70, flex: 1 }}>
            <div style={{ width: 72, height: 4, background: palette.accent, marginBottom: 28 }} />
            <div style={{ display: "flex", flexDirection: "column", fontSize: l2 ? 56 : 64, fontWeight: 700, lineHeight: 1.24, color: palette.ink }}>
              <span>{l1}</span>
              {l2 ? <span>{l2}</span> : null}
            </div>
            <div style={{ fontSize: 19, color: palette.ink, opacity: 0.55, marginTop: 28, display: "flex", letterSpacing: "0.06em" }}>
              {date}{readTime ? ` · ${readTime}` : ""}
            </div>
          </div>

          {/* 底栏 */}
          <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: `1px solid ${palette.wash}`, paddingTop: 20 }}>
            <div style={{ fontSize: 19, color: palette.ink, opacity: 0.6, fontStyle: "italic" }}>慢下来，写点值得读的东西。</div>
            <div style={{ fontSize: 16, color: palette.ink, opacity: 0.4, letterSpacing: "0.08em" }}>{getSiteHost()}</div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
