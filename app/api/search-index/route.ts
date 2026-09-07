import { NextResponse } from "next/server"
import { getAllPosts } from "@/lib/posts"
import { prisma } from "@/lib/prisma"

// 全局搜索索引：运行时按需生成（数据量小 ≤100 篇），CDN 缓存 1h + SWR。
// 发布/编辑文章触发的 revalidateTag 会连带刷新，索引自动跟进。
// DB 不可达时降级为空索引（面板显示空态，页面不报错）。
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
      posts: posts.map((p) => ({
        id: p.id,
        title: p.titleZh || p.title,
        titleEn: p.title,
        excerpt: (p.excerptZh || p.excerpt || "").slice(0, 160),
        category: p.category,
        tags: p.tags || [],
        date: p.displayDate,
        readTime: p.readTime || "",
        body: stripMd(extractText(p.content)).slice(0, 20000),
      })),
      thoughts: thoughts.map((n) => ({
        id: n.id,
        text: (n.contentZh || n.content || "").slice(0, 120),
        date: n.createdAt,
      })),
      categories: [...catSet.entries()].map(([name, count]) => ({ name, count })),
    }
    return NextResponse.json(index, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" },
    })
  } catch {
    return NextResponse.json({ v: 1, posts: [], thoughts: [], categories: [], offline: true })
  }
}
