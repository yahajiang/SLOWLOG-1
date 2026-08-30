import { NextRequest, NextResponse } from "next/server";
import { verifyToken, SessionPayload } from "@/lib/jwt";

export interface AuthResult {
  success: true;
  user: SessionPayload;
}

export async function authMiddleware(
  request: NextRequest
): Promise<AuthResult | NextResponse> {
  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "未登录" },
      { status: 401 }
    );
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "登录已过期" },
      { status: 401 }
    );
  }

  return { success: true, user: payload };
}

export function sanitizeId(id: string): string {
  // Remove path traversal attempts and non-safe characters
  return id
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .replace(/\.\./g, "")
    .replace(/^\.+/, "")
    .replace(/\.+$/, "")
    .slice(0, 100);
}

export function sanitizeInput(input: string): string {
  // Remove potential YAML injection characters
  return input
    .replace(/[\r\n]+/g, " ")
    .replace(/:/g, "：")
    .replace(/"/g, '\\"')
    .trim();
}
