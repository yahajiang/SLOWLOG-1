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

export async function GET() {
  try {
    if (hasDatabase()) {
      try {
        const { prisma } = await import("@/lib/prisma");
        const rows = await prisma.thought.findMany({ orderBy: { createdAt: "desc" } });
        if (rows.length > 0) return NextResponse.json(rows.map(dbRowToThought));
      } catch (e) {
        console.warn("[api/thoughts] DB error, fallback to fs:", e);
      }
    }
    return NextResponse.json(readThoughtsFromFs());
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch thoughts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;
    const body = await request.json();
    const { text, textZh } = body;
    if (!text && !textZh)
      return NextResponse.json({ error: "请至少填写一种语言的内容" }, { status: 400 });

    const now = new Date();
    const id = String(now.getTime());

    if (hasDatabase()) {
      try {
        const { prisma } = await import("@/lib/prisma");
        const created = await prisma.thought.create({
          data: {
            id,
            text: text || "",
            textZh: textZh || "",
            time: "just now",
            timeZh: "刚刚",
            createdAt: now,
          },
        });
        return NextResponse.json(dbRowToThought(created), { status: 201 });
      } catch (e) {
        console.warn("[api/thoughts] DB error, fallback to fs:", e);
      }
    }

    const newThought: Thought = {
      id,
      text: text || "",
      textZh: textZh || "",
      time: "just now",
      timeZh: "刚刚",
      createdAt: now.toISOString(),
    };
    const thoughts = readThoughtsFromFs();
    thoughts.unshift(newThought);
    writeThoughtsToFs(thoughts);
    return NextResponse.json(newThought, { status: 201 });
  } catch (error) {
    console.error("POST /api/thoughts error:", error);
    return NextResponse.json({ error: "Failed to create thought" }, { status: 500 });
  }
}
