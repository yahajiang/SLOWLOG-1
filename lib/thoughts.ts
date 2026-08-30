import fs from "fs";
import path from "path";

const THOUGHTS_PATH = path.join(process.cwd(), "data", "thoughts.json");
export interface Thought { id: string; text: string; textZh: string; time: string; timeZh: string; createdAt?: string; }

function hasDatabase(): boolean { return !!process.env.DATABASE_URL; }
function getThoughtsFromFs(): Thought[] {
  try {
    if (!fs.existsSync(THOUGHTS_PATH)) return [];
    const raw = fs.readFileSync(THOUGHTS_PATH, "utf-8");
    const data = JSON.parse(raw);
    return data.thoughts || [];
  } catch (error) { console.error("Failed to read thoughts:", error); return []; }
}
export async function getThoughts(): Promise<Thought[]> {
  if (hasDatabase()) {
    try {
      const { prisma } = await import("./prisma");
      const rows = await prisma.thought.findMany({ orderBy: { createdAt: "desc" } });
      if (rows.length > 0) return rows.map((r: any) => ({ id: r.id, text: r.text, textZh: r.textZh || "", time: r.time, timeZh: r.timeZh || "", createdAt: r.createdAt?.toISOString() }));
    } catch (e) { console.warn("[thoughts] DB fallback", e); }
  }
  return getThoughtsFromFs();
}
export function getThoughtsSync(): Thought[] { return getThoughtsFromFs(); }
