import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { getAllPosts } from "@/lib/posts";
import { authMiddleware, sanitizeId, sanitizeInput } from "@/lib/api-utils";

const CONTENT_DIR = path.join(process.cwd(), "content", "posts");

function toDisplayDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const showDrafts = url.searchParams.get("drafts") === "true";
    const posts = (await getAllPosts())
      .filter((p) => showDrafts || !p.draft)
      .map(({ html, markdown, htmlZh, markdownZh, headings, headingsZh, ...rest }) => rest);
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
    console.log("[api/posts] POST body keys:", Object.keys(body));
    console.log("[api/posts] title:", title, "excerpt:", excerpt?.slice(0, 30), "category:", category, "markdown len:", markdown?.length, "rawId:", rawId);
    if (!title || !excerpt || !category || !markdown) {
      console.log("[api/posts] Validation failed - missing field. title=?", !!title, "excerpt=?", !!excerpt, "category=?", !!category, "markdown=?", !!markdown);
      return NextResponse.json({ error: "Missing required fields: title, excerpt, category, markdown" }, { status: 400 });
    }
    const safeTitle = sanitizeInput(String(title));
    const safeExcerpt = sanitizeInput(String(excerpt));
    const safeCategory = sanitizeInput(String(category));
    const id = sanitizeId(String(rawId || title));
    console.log("[api/posts] Generated id:", id, "rawId:", rawId);
    if (!id) return NextResponse.json({ error: "Invalid id/slug" }, { status: 400 });

    const finalDate = date || new Date().toISOString().slice(0, 10);
    const finalDisplayDate = sanitizeInput(displayDate || toDisplayDate(finalDate));
    const safeAuthor = sanitizeInput(String(author || "Anonymous"));
    const safeAuthorInitial = sanitizeInput(String(authorInitial || (author || "A")[0].toUpperCase()));
    const safeReadTime = sanitizeInput(String(readTime || "5 min"));
    const safeTags = Array.isArray(tags) ? tags.map((t: string) => sanitizeInput(String(t))) : [];

    if (process.env.DATABASE_URL) {
      try {
        const { prisma } = await import("@/lib/prisma");
        const existing = await prisma.post.findUnique({ where: { id } });
        if (existing) return NextResponse.json({ error: `Post "${id}" already exists` }, { status: 409 });
        const postData: Record<string, unknown> = {
          id,
          title: safeTitle,
          titleZh: safeTitle,
          excerpt: safeExcerpt,
          excerptZh: safeExcerpt,
          category: safeCategory,
          author: safeAuthor,
          authorInitial: safeAuthorInitial,
          date: new Date(finalDate),
          displayDate: finalDisplayDate,
          readTime: safeReadTime,
          featured: !!featured,
          tags: safeTags,
          markdown: String(markdown).trim(),
          markdownZh: String(markdown).trim(),
        };
        try {
          await prisma.post.create({ data: { ...postData, draft: false } });
        } catch (createErr: any) {
          console.log("[api/posts] Create with draft failed:", createErr?.message?.slice(0, 200));
          if (createErr?.message?.includes("draft")) {
            await prisma.post.create({ data: postData });
          } else {
            throw createErr;
          }
        }
        console.log(`[api/posts] Post "${id}" created in DB`);
        revalidatePath("/");
        revalidatePath("/admin");
        revalidatePath(`/posts/${id}`);
        return NextResponse.json({ id, message: "Created" }, { status: 201 });
      } catch (e: any) {
        console.warn("[api/posts] DB error, fallback to fs:", e?.message?.slice(0, 300));
      }
    }

    const filePath = path.join(CONTENT_DIR, `${id}.md`);
    if (fs.existsSync(filePath)) return NextResponse.json({ error: `Post "${id}" already exists` }, { status: 409 });
    const fm = `---
title: "${safeTitle}"
excerpt: "${safeExcerpt}"
category: "${safeCategory}"
author: "${safeAuthor}"
authorInitial: "${safeAuthorInitial}"
date: "${finalDate}"
displayDate: "${finalDisplayDate}"
readTime: "${safeReadTime}"
featured: ${featured ? "true" : "false"}
tags: [${safeTags.map((t) => `"${t}"`).join(", ")}]
---

${String(markdown).trim()}
`;
    console.log("[api/posts] Writing to filesystem:", filePath);
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
    fs.writeFileSync(filePath, fm, "utf-8");
    console.log("[api/posts] File written successfully");
    revalidatePath("/");
    revalidatePath("/admin");
    return NextResponse.json({ id, message: "Created" }, { status: 201 });
  } catch (e: any) {
    console.error("[api/posts] POST error:", e?.message, e?.stack?.slice(0, 500));
    return NextResponse.json({ error: "Failed to create post", detail: e?.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;
    const body = await request.json();
    const { id, title, excerpt, category, author, authorInitial, date, readTime, featured, tags, markdown } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    if (process.env.DATABASE_URL) {
      try {
        const { prisma } = await import("@/lib/prisma");
        const existing = await prisma.post.findUnique({ where: { id } });
        if (existing) {
          await prisma.post.update({
            where: { id },
            data: {
              ...(title !== undefined && { title, titleZh: title }),
              ...(excerpt !== undefined && { excerpt, excerptZh: excerpt }),
              ...(category !== undefined && { category }),
              ...(author !== undefined && { author }),
              ...(authorInitial !== undefined && { authorInitial }),
              ...(date !== undefined && { date: new Date(date) }),
              ...(readTime !== undefined && { readTime }),
              ...(featured !== undefined && { featured }),
              ...(tags !== undefined && { tags }),
              ...(markdown !== undefined && { markdown: String(markdown).trim(), markdownZh: String(markdown).trim() }),
              draft: true,
            },
          });
          revalidatePath("/");
          revalidatePath(`/posts/${id}`);
          return NextResponse.json({ id, message: "Draft saved" });
        }
      } catch (e) {
        console.warn("[api/posts] PATCH DB error, fallback to fs:", e);
      }
    }

    const filePath = path.join(CONTENT_DIR, `${id}.md`);
    if (!fs.existsSync(filePath)) {
      const fm = `---
title: "${sanitizeInput(String(title || ""))}"
excerpt: "${sanitizeInput(String(excerpt || ""))}"
category: "${sanitizeInput(String(category || "Design"))}"
author: "${sanitizeInput(String(author || "Anonymous"))}"
authorInitial: "${sanitizeInput(String(authorInitial || "A"))}"
date: "${date || new Date().toISOString().slice(0, 10)}"
displayDate: ""
readTime: "${sanitizeInput(String(readTime || "5 min"))}"
featured: ${featured ? "true" : "false"}
draft: true
tags: [${Array.isArray(tags) ? tags.map((t: string) => `"${sanitizeInput(String(t))}"`).join(", ") : ""}]
---

${String(markdown || "").trim()}
`;
      fs.mkdirSync(CONTENT_DIR, { recursive: true });
      fs.writeFileSync(filePath, fm, "utf-8");
    } else {
      const raw = fs.readFileSync(filePath, "utf-8");
      const fm = raw.replace(/^---\n[\s\S]*?\n---/, `---
title: "${sanitizeInput(String(title || ""))}"
excerpt: "${sanitizeInput(String(excerpt || ""))}"
category: "${sanitizeInput(String(category || "Design"))}"
author: "${sanitizeInput(String(author || "Anonymous"))}"
authorInitial: "${sanitizeInput(String(authorInitial || "A"))}"
date: "${date || new Date().toISOString().slice(0, 10)}"
displayDate: ""
readTime: "${sanitizeInput(String(readTime || "5 min"))}"
featured: ${featured ? "true" : "false"}
draft: true
tags: [${Array.isArray(tags) ? tags.map((t: string) => `"${sanitizeInput(String(t))}"`).join(", ") : ""}]
---`).replace(/---\n[\s\S]*$/, `\n${String(markdown || "").trim()}\n`);
      fs.writeFileSync(filePath, fm, "utf-8");
    }
    revalidatePath("/");
    return NextResponse.json({ id, message: "Draft saved" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;
    const body = await request.json();
    const { ids } = body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Missing ids array" }, { status: 400 });
    }

    if (process.env.DATABASE_URL) {
      try {
        const { prisma } = await import("@/lib/prisma");
        await prisma.post.deleteMany({ where: { id: { in: ids } } });
        revalidatePath("/");
        for (const id of ids) revalidatePath(`/posts/${id}`);
        return NextResponse.json({ message: `Deleted ${ids.length} posts` });
      } catch (e) {
        console.warn("[api/posts] DELETE batch DB error, fallback to fs:", e);
      }
    }

    let deleted = 0;
    for (const id of ids) {
      const safeId = sanitizeId(String(id));
      const filePath = path.join(CONTENT_DIR, `${safeId}.md`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deleted++;
        revalidatePath(`/posts/${safeId}`);
      }
    }
    revalidatePath("/");
    return NextResponse.json({ message: `Deleted ${deleted} posts` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete posts" }, { status: 500 });
  }
}
