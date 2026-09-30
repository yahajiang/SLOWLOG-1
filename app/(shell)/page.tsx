import { getAllPosts, stripPostHeavy } from "@/lib/posts";
import { adaptLegacyPost } from "@/lib/adapt";
import { prisma } from "@/lib/prisma";
import HomeClient from "@/components/HomeClient";
import { getSiteUrlSync } from "@/lib/site-url";

export const revalidate = 60;

// self-canonical：首页原本完全不声明 canonical，而它并不消费 ?page= 之类参数
// （实测 /?page=2 与首页同样内容、同样 200）——参数 URL 因此会被当独立页收录。
export const metadata = {
  alternates: { canonical: getSiteUrlSync() },
};

export async function generateStaticParams() {
  return [];
}

export default async function Page() {
  const [postsRaw, dbCats] = await Promise.all([
    getAllPosts(),
    prisma.category.findMany({ orderBy: { createdAt: "asc" } }).catch(() => []),
  ]);
  // adapt to legacy Post shape expected by HomeClient (titleZh etc)
  const posts = postsRaw.map(stripPostHeavy).map(adaptLegacyPost);
  const categories = dbCats.length
    ? [{ id: "all", name: "All", nameZh: "全部", slug: "all" }, ...dbCats]
    : undefined
  return (
    <HomeClient posts={posts} categories={categories} />
  );
}
