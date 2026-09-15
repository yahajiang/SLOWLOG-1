import { getAllPosts, stripPostHeavy } from "@/lib/posts"
import ArchiveClient from "@/app/(shell)/archive/ArchiveClient"
import { DesktopEscape } from "@/components/DesktopEscape"

export const dynamic = "force-dynamic"
export const revalidate = 0

// 平板树归档：与 /archive 同构（ArchiveClient 复用）
export const metadata = {
  title: "归档 · 慢日志",
  description: "按年份浏览全部文章",
  robots: { index: false, follow: true },
}

export default async function TabletArchivePage() {
  const posts = (await getAllPosts()).map(stripPostHeavy)
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
      <div className="fixed bottom-3 left-3 z-40">
        <DesktopEscape desktopPath="/archive" />
      </div>
    </div>
  )
}
