import type { Metadata } from "next";
import CategoriesClient from "./CategoriesClient";

export const metadata: Metadata = { title: "分类" };

export default function CategoriesPage() {
  return <CategoriesClient />;
}
