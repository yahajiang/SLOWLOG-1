import { getAllPosts, stripPostHeavy } from "@/lib/posts";
import { adaptLegacyPost } from "@/lib/adapt";
import { prisma } from "@/lib/prisma";
import HomeClient from "@/components/HomeClient";

export const revalidate = 60;

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
