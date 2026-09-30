import type { Metadata } from "next";
import PostsClient from "./PostsClient";

export const metadata: Metadata = { title: "文章" };

export default function PostsPage() {
  return <PostsClient />;
}
