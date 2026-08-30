import fs from "fs";
import path from "path";

const THOUGHTS_PATH = path.join(process.cwd(), "data", "thoughts.json");

export interface Thought {
  id: string;
  text: string;
  textZh: string;
  time: string;
  timeZh: string;
}

export function getThoughts(): Thought[] {
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
