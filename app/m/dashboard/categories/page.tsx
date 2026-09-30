import type { Metadata } from "next";
import MCategoriesClient from "./MCategoriesClient";

export const metadata: Metadata = { title: "分类" };

export default function MobileCategoriesPage() {
  return <MCategoriesClient />;
}
