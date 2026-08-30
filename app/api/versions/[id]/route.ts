import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { authMiddleware } from "@/lib/api-utils";

const VERSIONS_PATH = path.join(process.cwd(), "data", "versions.json");

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

export async function GET(_request: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
  try {
    const { id } = await params;
    const versions = readVersions();
    const version = versions.find((v) => v.id === id);
    if (!version) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(version);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch version" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
  try {
    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;
    const { id } = await params;
    const versions = readVersions();
    const filtered = versions.filter((v) => v.id !== id);
    fs.mkdirSync(path.dirname(VERSIONS_PATH), { recursive: true });
    fs.writeFileSync(VERSIONS_PATH, JSON.stringify({ versions: filtered }, null, 2), "utf-8");
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete version" }, { status: 500 });
  }
}
