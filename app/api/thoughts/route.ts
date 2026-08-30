import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

async function getPayloadClient() {
  if (!process.env.PAYLOAD_SECRET) return null
  return getPayload({ config })
}

export async function GET() {
  try {
    const payload = await getPayloadClient();
    if (!payload) return NextResponse.json([]);
    const result = await payload.find({
      collection: "notes",
      sort: "-date",
      limit: 50,
    });
    const thoughts = result.docs.map((doc: any) => ({
      id: doc.id,
      text: doc.content || "",
      textZh: doc.content || "",
      time: "just now",
      timeZh: "刚刚",
      createdAt: doc.createdAt || doc.date,
    }));
    return NextResponse.json(thoughts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch thoughts" }, { status: 500 });
  }
}
