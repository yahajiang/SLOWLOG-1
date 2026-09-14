import { getAllPosts } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import HomeClient from "@/components/HomeClient";
import { DesktopEscape } from "@/components/DesktopEscape";

export const revalidate = 60;

// 平板树首页：与 / 同构（桌面编辑风 + 触控优化），由 middleware 按平板 UA / view=tablet 引导
export const metadata = {
  title: "慢日志",
  description: "慢下来，写点值得读的东西。关于设计、代码与思考的个人博客。",
  robots: { index: false, follow: true },
};

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
    headings: [],
    headingsZh: p.headingsZh,
    createdAt: new Date(p.createdAt).toISOString(),
    content: "",
    pageConfig: undefined,
  })) as any;
  const categories = dbCats.length
    ? [{ id: "all", name: "All", nameZh: "全部", slug: "all" } as any, ...dbCats]
    : undefined
  return (
    <>
      <HomeClient posts={posts} categories={categories} />
      <div className="fixed bottom-3 left-3 z-40">
        <DesktopEscape desktopPath="/" />
      </div>
    </>
  );
}
