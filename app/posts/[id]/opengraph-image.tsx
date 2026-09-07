import { ImageResponse } from "next/og"
import { getPostById, getPostBySlug } from "@/lib/posts"

// OG 分享图（v0.3 蓝图 Chapter 02 实现）：
// 纸底颗粒 + S 印章 + 品牌行 + 分类徽章 + accent 下划线 + 大字标题 + 元信息 + 底栏格言/域名。
// 标题超长按标点/空格智能断行（≤2 行，不拆词）。生成失败由 Next 回退整站默认 og:image。
// 注意：URL [id] 可能是 slug（老链接）或 cuid（站内链接），双查兜底。
export const runtime = "nodejs"
export const revalidate = 3600
export const alt = "慢日志 SlowLog"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

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
  const category = post?.categoryName || post?.category || "Design"
  const date = post?.displayDate || ""
  const readTime = post?.readTime || ""
  const [l1, l2] = breakTitle(title)
  const catLabel = category.replace(new RegExp(`^${category.split(" ")[0]}\\s*·?\\s*`, "i"), "")
  const catMain = category.split(" ")[0]

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          background: "#fefdfa", color: "#1c1c1e", padding: "44px 48px", position: "relative",
        }}
      >
        {/* 品牌行 */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 9999, background: "#18181b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontStyle: "italic", fontSize: 24, transform: "rotate(-3deg)" }}>S</div>
          <div style={{ fontSize: 20, color: "#8e8e93", display: "flex" }}>
            <span style={{ letterSpacing: "0.08em" }}>慢日志</span>
            <span style={{ letterSpacing: "0.16em", fontFamily: "monospace" }}> · SLOWLOG</span>
          </div>
        </div>
        {/* 分类徽章 */}
        <div style={{ position: "absolute", top: 52, right: 48, fontSize: 17, color: "#8e8e93", border: "1px solid #e5e5e7", padding: "8px 18px", display: "flex" }}>
          <span style={{ letterSpacing: "0.1em" }}>{catMain}</span>
        </div>
        {/* 标题块 */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 60 }}>
          <div style={{ width: 64, height: 3, background: "#5468d4", marginBottom: 30 }} />
          <div style={{ display: "flex", flexDirection: "column", fontSize: l2 ? 52 : 58, fontWeight: 700, lineHeight: 1.28 }}>
            <span>{l1}</span>
            {l2 ? <span>{l2}</span> : null}
          </div>
          <div style={{ fontSize: 19, color: "#8e8e93", marginTop: 26, display: "flex", letterSpacing: "0.06em" }}>
            {date}{readTime ? ` · ${langRead(readTime)}` : ""}
          </div>
        </div>
        {/* 底栏 */}
        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid #dddad2", paddingTop: 22 }}>
          <div style={{ fontSize: 19, color: "#8e8e93", fontStyle: "italic" }}>慢下来，写点值得读的东西。</div>
          <div style={{ fontSize: 16, color: "#b0aead", letterSpacing: "0.08em" }}>yahajiang.dpdns.org</div>
        </div>
      </div>
    ),
    { ...size }
  )
}

function langRead(rt: string) {
  return rt // readTime 已是本地化字符串（如「阅读约 8 分钟」）
}
