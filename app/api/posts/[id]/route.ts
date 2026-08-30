import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
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
    const post = getPostById(safeId);
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
    const filePath = path.join(CONTENT_DIR, `${safeId}.md`);
    if (!isValidPath(filePath)) return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    if (!fs.existsSync(filePath)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = await request.json();
    const { title, excerpt, category, author, authorInitial, date, displayDate, readTime, featured, tags, markdown } = body;
    if (!title || !excerpt || !category || !markdown) {
      return NextResponse.json({ error: "Missing required fields: title, excerpt, category, markdown" }, { status: 400 });
    }
    const fm = `---
title: "${sanitizeInput(String(title))}"
excerpt: "${sanitizeInput(String(excerpt))}"
category: "${sanitizeInput(String(category))}"
author: "${sanitizeInput(String(author || "Anonymous"))}"
authorInitial: "${sanitizeInput(String(authorInitial || (author || "A")[0].toUpperCase()))}"
date: "${sanitizeInput(String(date || new Date().toISOString().slice(0, 10)))}"
displayDate: "${sanitizeInput(String(displayDate || date || ""))}"
readTime: "${sanitizeInput(String(readTime || "5 min"))}"
featured: ${featured ? "true" : "false"}
tags: [${Array.isArray(tags) ? tags.map((t: string) => `"${sanitizeInput(String(t))}"`).join(", ") : ""}]
---

${String(markdown).trim()}
`;
    fs.writeFileSync(filePath, fm, "utf-8");
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
    const filePath = path.join(CONTENT_DIR, `${safeId}.md`);
    if (!isValidPath(filePath)) return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    if (!fs.existsSync(filePath)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    fs.unlinkSync(filePath);
    return NextResponse.json({ message: "Deleted" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
