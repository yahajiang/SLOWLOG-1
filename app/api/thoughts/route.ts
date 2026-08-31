import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const rows = await prisma.note.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
    const thoughts = rows.map((doc) => ({
      id: doc.id,
      text: doc.content || "",
      textZh: doc.contentZh || doc.content || "",
      content: doc.content || "",
      contentZh: doc.contentZh || doc.content || "",
      time: "just now",
      timeZh: "刚刚",
      createdAt: doc.createdAt,
    }));
    return NextResponse.json(thoughts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch thoughts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const body = await req.json();
    const text = body.textZh || body.text || body.content || ""
    if (!text || text.length > 500) return NextResponse.json({ error: "Invalid content" }, { status: 400 })
    const doc = await prisma.note.create({ data: { content: text, contentZh: body.textZh || text } })
    return NextResponse.json({ id: doc.id, text: doc.content, textZh: doc.contentZh, createdAt: doc.createdAt })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to create" }, { status: 500 })
  }
}
