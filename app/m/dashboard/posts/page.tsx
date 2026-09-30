import type { Metadata } from "next";
import MPostsClient from "./MPostsClient";

export const metadata: Metadata = { title: "文章" };

export default function MobilePostsPage() {
  return <MPostsClient />;
}
