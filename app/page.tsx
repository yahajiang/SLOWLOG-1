import { getAllPosts } from "@/lib/posts";
import HomeClient from "@/components/HomeClient";
import { LangProvider } from "@/lib/lang-context";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function Page() {
  const posts = await getAllPosts();
  return (
    <LangProvider>
      <HomeClient posts={posts} />
    </LangProvider>
  );
}
