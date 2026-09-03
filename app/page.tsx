import { getAllPosts } from "@/lib/posts";
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
  const posts = postsRaw.map((p) => ({
    id: p.id,
    title: p.title,
    titleZh: p.titleZh || p.title,
    excerpt: p.excerpt || "",
    excerptZh: p.excerptZh || p.excerpt || "",
    category: p.category as any,
    author: p.author || "Yahajiang",
    authorInitial: p.authorInitial || "Y",
    date: p.publishedAt ? new Date(p.publishedAt).toISOString().slice(0, 10) : new Date(p.createdAt).toISOString().slice(0, 10),
    displayDate: p.displayDate,
    readTime: p.readTime || "5 min",
    featured: p.featured,
    draft: p.status === "draft",
    tags: p.tags,
    markdown: "",
    markdownZh: "",
    html: "",
    htmlZh: "",
    headings: p.headings,
    headingsZh: p.headingsZh,
    createdAt: new Date(p.createdAt).toISOString(),
    content: p.content,
    pageConfig: p.pageConfig,
  })) as any;
  const categories = dbCats.length
    ? [{ id: "all", name: "All", nameZh: "全部", slug: "all" } as any, ...dbCats]
    : undefined
  return (
    <HomeClient posts={posts} categories={categories} />
  );
}
