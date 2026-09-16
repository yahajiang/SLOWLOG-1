import { getPostsPage, getArchiveStats, stripPostHeavy, FRONT_PAGE_SIZE_MAX } from "@/lib/posts"
import { getSettings } from "@/lib/settings"
import ArchiveClient from "./ArchiveClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "归档 · 慢日志",
  description: "按年份浏览全部文章",
}

/**
 * 归档（服务端分页）：每页 postsPerPage 篇（站点设置），年份分组只针对当页；
 * 搜索在服务端完成（?q=）。统计走全站口径，不随翻页变化。
 */
export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const requested = Math.max(1, Number(sp.page) || 1);

  const settings = await getSettings();
  // 每页条数：站点设置可下调，但不允许超过 FRONT_PAGE_SIZE_MAX（前台列表单页上限）
  const pageSize = Math.min(settings.postsPerPage || FRONT_PAGE_SIZE_MAX, FRONT_PAGE_SIZE_MAX);

  const [pageData, stats] = await Promise.all([
    getPostsPage({ page: requested, pageSize, q }),
    getArchiveStats(),
  ]);

  const posts = pageData.items.map(stripPostHeavy);
  // 当页按发布时间倒序 → 按年份分组（与原来全量分组的观感一致）
  const sorted = [...posts].sort(
    (a, b) =>
      new Date((b as any).publishedAt || (b as any).createdAt || (b as any).date).getTime() -
      new Date((a as any).publishedAt || (a as any).createdAt || (a as any).date).getTime()
  );
  const byYear = new Map<number, typeof sorted>();
  for (const p of sorted) {
    const y = new Date((p as any).publishedAt || (p as any).createdAt).getFullYear();
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(p);
  }
  const years = [...byYear.entries()].sort((a, b) => b[0] - a[0]);

  return (
    <div className="min-h-screen bg-[var(--yh-bg)] flex flex-col">
      <ArchiveClient
        years={years}
        total={pageData.total}
        stats={stats}
        page={pageData.page}
        totalPages={pageData.totalPages}
        initialQ={q}
      />
    </div>
  );
}
