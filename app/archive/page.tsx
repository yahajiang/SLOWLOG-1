import Link from "next/link"
import { getAllPosts } from "@/lib/posts"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import ArchiveClient from "./ArchiveClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "归档 · 慢日志",
  description: "按年份浏览全部文章",
}

export default async function ArchivePage() {
  const posts = await getAllPosts()
  const sorted = [...posts].sort((a,b)=> new Date((b as any).publishedAt||(b as any).createdAt||(b as any).date).getTime() - new Date((a as any).publishedAt||(a as any).createdAt||(a as any).date).getTime())
  const byYear = new Map<number, typeof sorted>()
  for (const p of sorted) {
    const y = new Date((p as any).publishedAt || (p as any).createdAt).getFullYear()
    if (!byYear.has(y)) byYear.set(y, [])
    byYear.get(y)!.push(p)
  }
  const years = [...byYear.entries()].sort((a,b)=> b[0]-a[0])

  return (
    <div className="min-h-screen bg-[var(--yh-bg)] flex flex-col">
      <ArchiveClient posts={posts} years={years} />
    </div>
  )
}
