import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { MDashHome } from "@/components/mobile/MDashHome";

export const dynamic = "force-dynamic";

const getMobileDashData = unstable_cache(
  async () => {
    const [stats, recent, noteCount, catCount, mediaCount] = await Promise.all([
      prisma.post.groupBy({
        by: ["status"],
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
      prisma.note.count(),
      prisma.category.count(),
      prisma.media.count().catch(() => 0),
    ]);
    const total = stats.reduce((a, s) => a + s._count._all, 0);
    const published = stats.find((s) => s.status === "published")?._count._all ?? 0;
    const draft = stats.find((s) => s.status === "draft")?._count._all ?? 0;
    const totalViews = stats.reduce((a, s) => a + (s._sum.viewCount || 0), 0);
    return { total, published, draft, totalViews, recent, noteCount, catCount, mediaCount };
  },
  ["m-dash-stats-v2"],
  { revalidate: 30, tags: ["posts", "thoughts", "categories"] }
);

export default async function MobileDashboardPage() {
  const data = await getMobileDashData();
  return <MDashHome data={JSON.parse(JSON.stringify(data))} />;
}
