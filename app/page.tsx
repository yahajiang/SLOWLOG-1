import { getAllPosts, getFeaturedPost } from "@/lib/payload";
import HomeClient from "@/components/HomeClient";
import { LangProvider } from "@/lib/lang-context";

export const revalidate = 300;

export default async function Page() {
  const posts = await getAllPosts();
  return (
    <LangProvider>
      <HomeClient posts={posts} />
    </LangProvider>
  );
}
