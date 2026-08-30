import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { authMiddleware } from "@/lib/api-utils";

const THOUGHTS_PATH = path.join(process.cwd(), "data", "thoughts.json");

interface Thought {
  id: string;
  text: string;
  textZh: string;
  time: string;
  timeZh: string;
  createdAt: string;
}

function readThoughtsFromFs(): Thought[] {
  try {
    if (!fs.existsSync(THOUGHTS_PATH)) return [];
    const raw = fs.readFileSync(THOUGHTS_PATH, "utf-8");
    const data = JSON.parse(raw);
    return data.thoughts || [];
  } catch (error) {
    console.error("Failed to read thoughts:", error);
    return [];
  }
}

function writeThoughtsToFs(thoughts: Thought[]): void {
  fs.mkdirSync(path.dirname(THOUGHTS_PATH), { recursive: true });
  fs.writeFileSync(THOUGHTS_PATH, JSON.stringify({ thoughts }, null, 2), "utf-8");
}

function hasDatabase(): boolean {
  return !!(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL
  );
}

function dbRowToThought(row: any): Thought {
  return {
    id: row.id,
    text: row.text ?? "",
    textZh: row.textZh ?? "",
    time: row.time ?? "just now",
    timeZh: row.timeZh ?? "刚刚",
    createdAt: row.createdAt
      ? row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt)
      : new Date().toISOString(),
  };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (hasDatabase()) {
      try {
        const { prisma } = await import("@/lib/prisma");
        const row = await prisma.thought.findUnique({ where: { id } });
        if (row) return NextResponse.json(dbRowToThought(row));
      } catch (e) {
        console.warn("[api/thoughts/[id]] DB error, fallback to fs:", e);
      }
    }
    const thoughts = readThoughtsFromFs();
    const thought = thoughts.find((t) => t.id === id);
    if (!thought) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(thought);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch thought" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;
    const { id } = await params;
    const body = await request.json();
    const { text, textZh } = body;

    if (hasDatabase()) {
      try {
        const { prisma } = await import("@/lib/prisma");
        const existing = await prisma.thought.findUnique({ where: { id } });
        if (existing) {
          const updated = await prisma.thought.update({
            where: { id },
            data: {
              ...(text !== undefined && { text }),
              ...(textZh !== undefined && { textZh }),
            },
          });
          return NextResponse.json(dbRowToThought(updated));
        }
      } catch (e) {
        console.warn("[api/thoughts/[id]] PUT DB error, fallback to fs:", e);
      }
    }

    const thoughts = readThoughtsFromFs();
    const index = thoughts.findIndex((t) => t.id === id);
    if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (text !== undefined) thoughts[index].text = text;
    if (textZh !== undefined) thoughts[index].textZh = textZh;
    writeThoughtsToFs(thoughts);
    return NextResponse.json(thoughts[index]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update thought" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;
    const { id } = await params;

    if (hasDatabase()) {
      try {
        const { prisma } = await import("@/lib/prisma");
        const existing = await prisma.thought.findUnique({ where: { id } });
        if (existing) {
          await prisma.thought.delete({ where: { id } });
          return NextResponse.json({ message: "Deleted" });
        }
      } catch (e) {
        console.warn("[api/thoughts/[id]] DELETE DB error, fallback to fs:", e);
      }
    }

    const thoughts = readThoughtsFromFs();
    const index = thoughts.findIndex((t) => t.id === id);
    if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    thoughts.splice(index, 1);
    writeThoughtsToFs(thoughts);
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete thought" }, { status: 500 });
  }
}
