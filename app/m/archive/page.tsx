import type { Metadata } from "next";
import { getAllPosts } from "@/lib/posts";
import { MArchive } from "@/components/mobile/MArchive";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export const metadata: Metadata = {
  title: "归档 · 慢日志",
  description: "按年份浏览全部文章",
  alternates: { canonical: `${siteUrl}/archive` },
};

export default async function MobileArchivePage() {
  const posts = await getAllPosts();
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
      <MArchive posts={posts} years={years} />
    </div>
  );
}
