import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const tokenMatch = cookieHeader.match(/auth-token=([^;]+)/);
    const token = tokenMatch?.[1];

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      username: payload.username,
      name: payload.name,
      isDefault: payload.isDefault,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { authenticated: false, error: "Authentication check failed" },
      { status: 500 }
    );
  }
}
