import { prisma } from "@/lib/prisma"
import { unstable_cache } from "next/cache"
import { StatCard } from "@/components/dashboard/StatCard"
import Link from "next/link"

export const dynamic = "force-dynamic"

const getDashboardData = unstable_cache(
  async () => {
    const [stats, recent] = await Promise.all([
      prisma.post.groupBy({
        by: ['status'],
        _count: { _all: true },
        _sum: { viewCount: true },
      }),
      prisma.post.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true, title: true, titleZh: true, status: true, updatedAt: true,
          category: { select: { name: true, nameZh: true } },
        },
      }),
    ])
    const total = stats.reduce((a, s) => a + s._count._all, 0)
    const published = stats.find(s => s.status === "published")?._count._all ?? 0
    const draft = stats.find(s => s.status === "draft")?._count._all ?? 0
    const totalViews = stats.reduce((a, s) => a + (s._sum.viewCount || 0), 0)
    return { total, published, draft, totalViews, recent }
  },
  ["dash-stats"],
  { revalidate: 60, tags: ["posts"] }
)

export default async function DashboardPage() {
  const { total, published, draft, totalViews, recent } = await getDashboardData()
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--dash-text)]" style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}>仪表盘</h1>
        <p className="text-sm text-[var(--dash-muted)] mt-1">概览你的内容</p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="文章总数" value={total} />
        <StatCard label="已发布" value={published} />
        <StatCard label="草稿" value={draft} />
        <StatCard label="总访问量" value={totalViews} />
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--dash-text)]">近期文章</h2>
            <Link href="/dashboard/posts" className="text-xs text-[var(--dash-accent)] hover:underline">查看全部</Link>
          </div>
          <div className="divide-y divide-[var(--dash-border)]">
            {recent.map((p) => (
              <Link key={p.id} href={`/dashboard/posts/${p.id}`} className="flex items-center justify-between py-3 hover:bg-[var(--dash-bg)] px-2 -mx-2 rounded-none transition-colors">
                <div>
                  <p className="text-sm font-medium text-[var(--dash-text)] line-clamp-1">{p.titleZh || p.title}</p>
                  <p className="text-xs text-[var(--dash-muted)]">{p.category?.nameZh || p.category?.name || "-"} · {p.status}</p>
                </div>
                <span className="text-xs text-[var(--dash-muted)]">{new Date(p.updatedAt).toLocaleDateString()}</span>
              </Link>
            ))}
            {recent.length === 0 && <p className="text-sm text-[var(--dash-muted)] py-8 text-center">暂无文章</p>}
          </div>
        </div>
        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold mb-4 text-[var(--dash-text)]">快速入口</h2>
          <div className="space-y-3">
            <Link href="/dashboard/posts/new" className="block w-full py-3 bg-[var(--dash-text)] text-white text-sm text-center rounded-none hover:opacity-90 transition-opacity font-medium">新建文章</Link>
            <Link href="/dashboard/notes" className="block w-full py-3 bg-[var(--dash-card)] border border-[var(--dash-border)] text-sm text-center rounded-none hover:bg-[var(--dash-bg)] transition-colors">新建随想</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
