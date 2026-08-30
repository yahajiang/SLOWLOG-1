import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

async function getPayloadClient() {
  if (!process.env.PAYLOAD_SECRET) return null
  return getPayload({ config })
}

export async function GET(_request: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
  try {
    const { id } = await params;
    const payload = await getPayloadClient();
    if (!payload) return NextResponse.json({ error: "Payload not configured" }, { status: 503 });
    try {
      const doc = await payload.findByID({ collection: "notes", id });
      return NextResponse.json({
        id: doc.id,
        text: doc.content || "",
        textZh: doc.content || "",
        time: "just now",
        timeZh: "刚刚",
        createdAt: doc.createdAt || doc.date,
      });
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch thought" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { text, textZh } = body;
    const payload = await getPayloadClient();
    if (!payload) return NextResponse.json({ error: "Payload not configured" }, { status: 503 });
    try {
      const doc = await payload.update({
        collection: "notes",
        id,
        data: { content: textZh || text || "" },
      });
      return NextResponse.json({
        id: doc.id,
        text: doc.content || "",
        textZh: doc.content || "",
      });
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update thought" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
  try {
    const { id } = await params;
    const payload = await getPayloadClient();
    if (!payload) return NextResponse.json({ error: "Payload not configured" }, { status: 503 });
    try {
      await payload.delete({ collection: "notes", id });
      return NextResponse.json({ message: "Deleted" });
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete thought" }, { status: 500 });
  }
}
