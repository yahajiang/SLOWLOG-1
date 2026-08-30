import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getAllPosts } from "@/lib/posts";
import { authMiddleware, sanitizeId, sanitizeInput } from "@/lib/api-utils";

const CONTENT_DIR = path.join(process.cwd(), "content", "posts");

function toDisplayDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export async function GET() {
  try {
    const posts = getAllPosts().map(({ html, markdown, htmlZh, markdownZh, headings, headingsZh, ...rest }) => rest);
    return NextResponse.json(posts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;
    const body = await request.json();
    const { id: rawId, title, excerpt, category, author, authorInitial, date, displayDate, readTime, featured, tags, markdown } = body;
    if (!title || !excerpt || !category || !markdown) {
      return NextResponse.json({ error: "Missing required fields: title, excerpt, category, markdown" }, { status: 400 });
    }
    const safeTitle = sanitizeInput(String(title));
    const safeExcerpt = sanitizeInput(String(excerpt));
    const safeCategory = sanitizeInput(String(category));
    const id = sanitizeId(String(rawId || title));
    if (!id) return NextResponse.json({ error: "Invalid id/slug" }, { status: 400 });
    const filePath = path.join(CONTENT_DIR, `${id}.md`);
    if (fs.existsSync(filePath)) return NextResponse.json({ error: `Post "${id}" already exists` }, { status: 409 });
    const finalDate = date || new Date().toISOString().slice(0, 10);
    const fm = `---
title: "${safeTitle}"
excerpt: "${safeExcerpt}"
category: "${safeCategory}"
author: "${sanitizeInput(String(author || "Anonymous"))}"
authorInitial: "${sanitizeInput(String(authorInitial || (author || "A")[0].toUpperCase()))}"
date: "${finalDate}"
displayDate: "${sanitizeInput(displayDate || toDisplayDate(finalDate))}"
readTime: "${sanitizeInput(String(readTime || "5 min"))}"
featured: ${featured ? "true" : "false"}
tags: [${Array.isArray(tags) ? tags.map((t: string) => `"${sanitizeInput(String(t))}"`).join(", ") : ""}]
---

${String(markdown).trim()}
`;
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
    fs.writeFileSync(filePath, fm, "utf-8");
    return NextResponse.json({ id, message: "Created" }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
