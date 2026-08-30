import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { authMiddleware } from "@/lib/api-utils";

const THOUGHTS_PATH = path.join(process.cwd(), "data", "thoughts.json");
interface Thought { id: string; text: string; textZh: string; time: string; timeZh: string; }
function readThoughts(): Thought[] {
  try { if (!fs.existsSync(THOUGHTS_PATH)) return []; const raw = fs.readFileSync(THOUGHTS_PATH, "utf-8"); const data = JSON.parse(raw); return data.thoughts || []; } catch (error) { console.error("Failed to read thoughts:", error); return []; }
}
function writeThoughts(thoughts: Thought[]): void { fs.mkdirSync(path.dirname(THOUGHTS_PATH), { recursive: true }); fs.writeFileSync(THOUGHTS_PATH, JSON.stringify({ thoughts }, null, 2), "utf-8"); }
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const thoughts = readThoughts();
    const thought = thoughts.find((t) => t.id === id);
    if (!thought) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(thought);
  } catch (error) { console.error(error); return NextResponse.json({ error: "Failed to fetch thought" }, { status: 500 }); }
}
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;
    const { id } = await params;
    const thoughts = readThoughts();
    const index = thoughts.findIndex((t) => t.id === id);
    if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = await request.json();
    const { text, textZh } = body;
    if (text !== undefined) thoughts[index].text = text;
    if (textZh !== undefined) thoughts[index].textZh = textZh;
    writeThoughts(thoughts);
    return NextResponse.json(thoughts[index]);
  } catch (error) { console.error(error); return NextResponse.json({ error: "Failed to update thought" }, { status: 500 }); }
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;
    const { id } = await params;
    const thoughts = readThoughts();
    const index = thoughts.findIndex((t) => t.id === id);
    if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    thoughts.splice(index, 1);
    writeThoughts(thoughts);
    return NextResponse.json({ message: "Deleted" });
  } catch (error) { console.error(error); return NextResponse.json({ error: "Failed to delete thought" }, { status: 500 }); }
}
