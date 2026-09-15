import { NextResponse } from "next/server"
import { getAllPosts } from "@/lib/posts"
import { prisma } from "@/lib/prisma"
import { pinyin } from "pinyin-pro"

// 拼音字段：py=全拼（连续无音调）、abbr=首字母——搜索面板支持拼音输入（sheji/sj → 设计）
function pyOf(text: string): { py: string; abbr: string } {
  const clean = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "")
  if (!clean) return { py: "", abbr: "" }
  try {
    return {
      py: pinyin(clean, { toneType: "none", type: "array", nonZh: "consecutive" }).join("").toLowerCase(),
      abbr: pinyin(clean, { pattern: "first", toneType: "none", type: "array", nonZh: "consecutive" }).join("").toLowerCase(),
    }
  } catch {
    return { py: "", abbr: "" }
  }
}

// 全局搜索索引：数据量小（≤100 篇），走 CDN 缓存 + SWR。
// 发布/编辑文章触发的 revalidateTag("posts") 会连带刷新，索引自动跟进。
// DB 不可达时降级为空索引（面板显示空态，页面不报错）。
//
// ⚠️ P2-15 缓存语义说明（经实测确认，勿按"纯运行时生成"理解本路由）：
// 声明 `revalidate = 3600` 意味着 App Router 会把它**预渲染并写入 Full Route Cache**，
// 构建产物中标记为 `○ (Static)`。若构建机数据库不可达，该次产物里就是空索引；
// 但运行期 ISR 会在 revalidate 窗口内重新生成，实测 `next start` 后返回正常数据
// （posts=3, offline=false），因此线上影响有限（这是把它定为观察项而非缺陷的原因）。
// 若希望彻底避免"构建期固化空索引"，可改用 `export const dynamic = "force-dynamic"`。
export const revalidate = 3600

function stripMd(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~]{1,3}/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// Tiptap JSON → 纯文本（递归收集 text 节点）
function extractText(node: unknown): string {
  if (!node) return ""
  if (Array.isArray(node)) return node.map(extractText).join(" ")
  if (typeof node === "object") {
    const n = node as { text?: unknown; content?: unknown }
    let s = typeof n.text === "string" ? n.text + " " : ""
    if (n.content) s += extractText(n.content)
    return s
  }
  return ""
}

export async function GET() {
  try {
    const posts = await getAllPosts()
    let thoughts: { id: string; content: string; contentZh: string | null; createdAt: Date }[] = []
    try {
      thoughts = await prisma.note.findMany({ orderBy: { createdAt: "desc" }, take: 50 })
    } catch {}

    const catSet = new Map<string, number>()
    for (const p of posts) catSet.set(p.category, (catSet.get(p.category) || 0) + 1)

    const index = {
      v: 1,
      generatedAt: new Date().toISOString(),
      posts: posts.map((p) => {
        const title = p.titleZh || p.title
        const pyT = pyOf(title)
        const catName = p.categoryName || p.category
        const pyC = pyOf(catName)
        return {
          id: p.id,
          title,
          titleEn: p.title,
          excerpt: (p.excerptZh || p.excerpt || "").slice(0, 160),
          category: p.category,
          tags: p.tags || [],
          date: p.displayDate,
          readTime: p.readTime || "",
          // 正文截断 2000 字：面板搜索主要匹配标题/摘要/标签，索引体积防膨胀（P1-4）
          body: stripMd(extractText(p.content)).slice(0, 2000),
          py: pyT.py + " " + pyC.py,
          abbr: pyT.abbr + " " + pyC.abbr,
        }
      }),
      thoughts: thoughts.map((n) => {
        const text = (n.contentZh || n.content || "").slice(0, 120)
        const pyT = pyOf(text)
        return {
          id: n.id,
          text,
          date: n.createdAt,
          py: pyT.py,
          abbr: pyT.abbr,
        }
      }),
      categories: [...catSet.entries()].map(([name, count]) => {
        const pyC = pyOf(name)
        return { name, count, py: pyC.py, abbr: pyC.abbr }
      }),
    }
    return NextResponse.json(index, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" },
    })
  } catch {
    return NextResponse.json({ v: 1, posts: [], thoughts: [], categories: [], offline: true })
  }
}
