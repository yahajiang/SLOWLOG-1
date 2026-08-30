import { NextResponse } from "next/server";
import { verifyUser } from "@/lib/auth";
import { createToken } from "@/lib/jwt";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "请输入用户名和密码" },
        { status: 400 }
      );
    }

    const result = await verifyUser(username, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await createToken({
      username,
      name: result.name || "",
      isDefault: result.isDefault,
    });

    const response = NextResponse.json({
      success: true,
      name: result.name,
      isDefault: result.isDefault,
    });

    // Set encrypted cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "登录失败" },
      { status: 500 }
    );
  }
}
