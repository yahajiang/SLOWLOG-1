import type { Metadata } from "next";
import { getAllPosts } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import { MHome } from "@/components/mobile/MHome";
import { adaptPost } from "@/lib/madapt";

export const revalidate = 60;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export const metadata: Metadata = {
  title: "慢日志",
  description: "慢下来，写点值得读的东西。关于设计、代码与思考的个人博客。",
  alternates: { canonical: siteUrl },
};

export default async function MobileHomePage() {
  const [postsRaw, dbCats] = await Promise.all([
    getAllPosts(),
    prisma.category.findMany({ orderBy: { createdAt: "asc" } }).catch(() => []),
  ]);
  const posts = postsRaw.map(adaptPost) as any;
  const categories = dbCats.length
    ? [{ id: "all", name: "All", nameZh: "全部", slug: "all" } as any, ...dbCats]
    : undefined;
  return <MHome posts={posts} categories={categories} />;
}
