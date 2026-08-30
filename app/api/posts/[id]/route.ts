import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { getPostById } from "@/lib/posts";
import { authMiddleware, sanitizeId, sanitizeInput } from "@/lib/api-utils";

const CONTENT_DIR = path.join(process.cwd(), "content", "posts");

function isValidPath(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  return resolved.startsWith(path.resolve(CONTENT_DIR));
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const safeId = sanitizeId(id);
    if (!safeId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    const post = await getPostById(safeId);
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(post);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;
    const { id } = await params;
    const safeId = sanitizeId(id);
    if (!safeId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    const body = await request.json();
    const { title, excerpt, category, author, authorInitial, date, displayDate, readTime, featured, tags, markdown } = body;
    if (!title || !excerpt || !category || !markdown) {
      return NextResponse.json({ error: "Missing required fields: title, excerpt, category, markdown" }, { status: 400 });
    }
    const safeTitle = sanitizeInput(String(title));
    const safeExcerpt = sanitizeInput(String(excerpt));
    const safeCategory = sanitizeInput(String(category));
    const safeAuthor = sanitizeInput(String(author || "Anonymous"));
    const safeAuthorInitial = sanitizeInput(String(authorInitial || (author || "A")[0].toUpperCase()));
    const safeTags = Array.isArray(tags) ? tags.map((t: string) => sanitizeInput(String(t))) : [];
    const safeDate = new Date(sanitizeInput(String(date || new Date().toISOString().slice(0, 10))));
    const safeDisplayDate = sanitizeInput(String(displayDate || date || ""));
    const safeReadTime = sanitizeInput(String(readTime || "5 min"));

    if (process.env.DATABASE_URL) {
      try {
        const { prisma } = await import("@/lib/prisma");
        const existing = await prisma.post.findUnique({ where: { id: safeId } });
        if (existing) {
          await prisma.post.update({
            where: { id: safeId },
            data: {
              title: safeTitle, titleZh: safeTitle, excerpt: safeExcerpt, excerptZh: safeExcerpt,
              category: safeCategory, author: safeAuthor, authorInitial: safeAuthorInitial,
              date: safeDate, displayDate: safeDisplayDate, readTime: safeReadTime, featured: !!featured, tags: safeTags,
              markdown: String(markdown).trim(), markdownZh: String(markdown).trim(),
            },
          });
          revalidatePath("/");
          revalidatePath(`/posts/${safeId}`);
          return NextResponse.json({ id: safeId, message: "Updated" });
        }
      } catch (e) { console.warn("[PUT] DB fallback", e); }
    }

    const filePath = path.join(CONTENT_DIR, `${safeId}.md`);
    if (!isValidPath(filePath)) return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    if (!fs.existsSync(filePath)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const fm = `---
title: "${safeTitle}"
excerpt: "${safeExcerpt}"
category: "${safeCategory}"
author: "${safeAuthor}"
authorInitial: "${safeAuthorInitial}"
date: "${safeDate.toISOString().slice(0, 10)}"
displayDate: "${safeDisplayDate}"
readTime: "${safeReadTime}"
featured: ${featured ? "true" : "false"}
tags: [${safeTags.map((t) => `"${t}"`).join(", ")}]
---

${String(markdown).trim()}
`;
    fs.writeFileSync(filePath, fm, "utf-8");
    revalidatePath("/");
    revalidatePath(`/posts/${safeId}`);
    return NextResponse.json({ id: safeId, message: "Updated" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;
    const { id } = await params;
    const safeId = sanitizeId(id);
    if (!safeId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    if (process.env.DATABASE_URL) {
      try {
        const { prisma } = await import("@/lib/prisma");
        const existing = await prisma.post.findUnique({ where: { id: safeId } });
        if (existing) {
          await prisma.post.delete({ where: { id: safeId } });
          revalidatePath("/");
          revalidatePath(`/posts/${safeId}`);
          return NextResponse.json({ message: "Deleted" });
        }
      } catch (e) { console.warn("[DELETE] DB fallback", e); }
    }

    const filePath = path.join(CONTENT_DIR, `${safeId}.md`);
    if (!isValidPath(filePath)) return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    if (!fs.existsSync(filePath)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    fs.unlinkSync(filePath);
    revalidatePath("/");
    revalidatePath(`/posts/${safeId}`);
    return NextResponse.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
