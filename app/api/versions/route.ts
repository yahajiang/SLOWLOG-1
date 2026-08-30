import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { authMiddleware } from "@/lib/api-utils";

const VERSIONS_PATH = path.join(process.cwd(), "data", "versions.json");
const MAX_VERSIONS = 4;

interface Version {
  id: string;
  postId: string;
  title: string;
  markdown: string;
  createdAt: string;
}

function readVersions(): Version[] {
  try {
    if (!fs.existsSync(VERSIONS_PATH)) return [];
    const raw = fs.readFileSync(VERSIONS_PATH, "utf-8");
    const data = JSON.parse(raw);
    return data.versions || [];
  } catch {
    return [];
  }
}

function writeVersions(versions: Version[]): void {
  fs.mkdirSync(path.dirname(VERSIONS_PATH), { recursive: true });
  fs.writeFileSync(VERSIONS_PATH, JSON.stringify({ versions }, null, 2), "utf-8");
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const postId = url.searchParams.get("postId");
    let versions = readVersions();
    if (postId) {
      versions = versions.filter((v) => v.postId === postId);
    }
    versions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json(versions.slice(0, MAX_VERSIONS));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;
    const body = await request.json();
    const { postId, title, markdown } = body;
    if (!postId || !markdown) {
      return NextResponse.json({ error: "Missing postId or markdown" }, { status: 400 });
    }

    const versions = readVersions();
    const newVersion: Version = {
      id: String(Date.now()),
      postId,
      title: title || "",
      markdown,
      createdAt: new Date().toISOString(),
    };

    versions.unshift(newVersion);

    const postVersions = versions.filter((v) => v.postId === postId);
    if (postVersions.length > MAX_VERSIONS) {
      const toDelete = postVersions.slice(MAX_VERSIONS);
      const deleteIds = new Set(toDelete.map((v) => v.id));
      const filtered = versions.filter((v) => !deleteIds.has(v.id));
      writeVersions(filtered);
    } else {
      writeVersions(versions);
    }

    return NextResponse.json(newVersion, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save version" }, { status: 500 });
  }
}
