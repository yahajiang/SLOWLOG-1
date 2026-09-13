import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export const dynamic = "force-dynamic";

const getDashboardData = unstable_cache(
  async () => {
    const [stats, recent, topViews, noteCount, catCount, mediaCount, recentNotes] = await Promise.all([
      prisma.post.groupBy({
        by: ["status"],
        _count: { _all: true },
        _sum: { viewCount: true },
      }),
      prisma.post.findMany({
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: {
          id: true, title: true, titleZh: true, status: true, updatedAt: true, featured: true,
          category: { select: { name: true, nameZh: true } },
        },
      }),
      prisma.post.findMany({
        where: { status: "published", viewCount: { gt: 0 } },
        orderBy: { viewCount: "desc" },
        take: 5,
        select: {
          id: true, title: true, titleZh: true, viewCount: true, slug: true,
          category: { select: { name: true, nameZh: true } },
        },
      }),
      prisma.note.count(),
      prisma.category.count(),
      prisma.media.count().catch(() => 0),
      prisma.note.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, content: true, contentZh: true, createdAt: true },
      }),
    ]);
    const total = stats.reduce((a, s) => a + s._count._all, 0);
    const published = stats.find((s) => s.status === "published")?._count._all ?? 0;
    const draft = stats.find((s) => s.status === "draft")?._count._all ?? 0;
    const archived = stats.find((s) => s.status === "archived")?._count._all ?? 0;
    const totalViews = stats.reduce((a, s) => a + (s._sum.viewCount || 0), 0);
    return {
      total,
      published,
      draft,
      archived,
      totalViews,
      noteCount,
      catCount,
      mediaCount,
      recent,
      topViews,
      recentNotes,
    };
  },
  ["dash-stats-v2"],
  { revalidate: 30, tags: ["posts", "thoughts", "categories"] }
);

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <DashboardHome data={data} />;
}
