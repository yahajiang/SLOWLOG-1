import { NextResponse } from "next/server";

/**
 * 统一 API 错误契约：{ error: string }（中文）+ 状态码。
 * 全部业务路由的错误响应都应经由本 helper 输出，保证前端可一致解析 data.error。
 */
export function apiError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

/** zod safeParse 失败 → 400（取第一条 issue 的中文信息） */
export function apiZodError(error: { issues: { message: string }[] }) {
  return apiError(400, error.issues[0]?.message || "参数错误");
}
