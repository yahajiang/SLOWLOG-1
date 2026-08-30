import { NextRequest, NextResponse } from "next/server";
import { updateUser } from "@/lib/auth";
import { createToken, verifyToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    // Verify current user is authenticated
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session) {
      return NextResponse.json({ error: "登录已过期" }, { status: 401 });
    }

    const body = await request.json();
    const { username, password, name } = body;

    // Only allow updating own account
    const currentUsername = session.username;

    if (!username && !password && !name) {
      return NextResponse.json(
        { error: "请至少修改一项信息" },
        { status: 400 }
      );
    }

    const result = await updateUser(currentUsername, {
      username,
      password,
      name,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // If username changed, create new token
    const newUsername = username || currentUsername;
    const newToken = await createToken({
      username: newUsername,
      name: name || session.name,
      isDefault: false,
    });

    const response = NextResponse.json({
      success: true,
      message: "账户信息已更新",
    });

    response.cookies.set("auth-token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "更新失败" },
      { status: 500 }
    );
  }
}
