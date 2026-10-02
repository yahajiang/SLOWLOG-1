import { prisma } from "@/lib/prisma"
import { UNSET_PAGE_CONFIG } from "@/lib/page-config"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import EditorClient from "./EditorClient"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "编辑" }
export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const isNew = id === "new"
  let post: any = null
  if (!isNew) {
    post = await prisma.post.findUnique({ where: { id }, include: { category: true } })
    if (!post) notFound()
  }
  const categories = await prisma.category.findMany({ orderBy: { createdAt: "asc" } })
  // empty template for new
  if (isNew) {
    post = {
      id: "new",
      title: "",
      titleZh: "",
      slug: "",
      excerpt: "",
      excerptZh: "",
      content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] },
      status: "draft",
      categoryId: null,
      tags: [],
      pageConfig: UNSET_PAGE_CONFIG,
      seoTitle: null,
      seoDescription: null,
      seoKeywords: [],
      canonicalUrl: null,
      ogImage: null,
      noIndex: false,
      featured: false,
      readTime: "5 min",
      author: "Yahajiang",
      authorInitial: "Y",
    }
  } else {
    if (!post.pageConfig) post.pageConfig = UNSET_PAGE_CONFIG
  }
  return <EditorClient initialPost={post} categories={categories} isNew={isNew} />
}
