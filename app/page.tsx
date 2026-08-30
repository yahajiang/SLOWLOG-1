import { getAllPosts } from "@/lib/posts";
import HomeClient from "@/components/HomeClient";
import { LangProvider } from "@/lib/lang-context";

export const dynamic = "force-static";

export default async function Page() {
  const posts = await getAllPosts();
  return (
    <LangProvider>
      <HomeClient posts={posts} />
    </LangProvider>
  );
}
