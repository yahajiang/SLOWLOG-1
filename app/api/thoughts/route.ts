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
export async function GET() {
  try { return NextResponse.json(readThoughts()); } catch (error) { console.error(error); return NextResponse.json({ error: "Failed to fetch thoughts" }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;
    const body = await request.json();
    const { text, textZh } = body;
    if (!text && !textZh) return NextResponse.json({ error: "请至少填写一种语言的内容" }, { status: 400 });
    const thoughts = readThoughts();
    const newThought: Thought = { id: String(Date.now()), text: text || "", textZh: textZh || "", time: "just now", timeZh: "刚刚" };
    thoughts.unshift(newThought);
    writeThoughts(thoughts);
    return NextResponse.json(newThought, { status: 201 });
  } catch (error) { console.error(error); return NextResponse.json({ error: "Failed to create thought" }, { status: 500 }); }
}
