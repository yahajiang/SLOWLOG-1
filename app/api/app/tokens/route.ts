import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import { auth, passwordChangeRequired } from "@/lib/auth"
import { apiError, apiZodError } from "@/lib/api-utils"
import { tokenCreateSchema } from "@/lib/schemas"
import { prisma } from "@/lib/prisma"
import { sha256Hex } from "@/lib/app-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session) return apiError(401, "未登录")
  if (passwordChangeRequired(session)) return apiError(403, "请先修改默认密码")
  const rows = await prisma.apiToken.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, createdAt: true, lastUsedAt: true, revokedAt: true },
  })
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError(401, "未登录")
  if (passwordChangeRequired(session)) return apiError(403, "请先修改默认密码")
  const parsed = tokenCreateSchema.safeParse(await req.json())
  if (!parsed.success) return apiZodError(parsed.error)
  const token = randomBytes(32).toString("hex")
  const row = await prisma.apiToken.create({
    data: { name: parsed.data.name, tokenHash: sha256Hex(token) },
    select: { id: true, name: true, createdAt: true },
  })
  return NextResponse.json({ ...row, token })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError(401, "未登录")
  if (passwordChangeRequired(session)) return apiError(403, "请先修改默认密码")
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return apiError(400, "缺少 id")
  try {
    await prisma.apiToken.updateMany({ where: { id, revokedAt: null }, data: { revokedAt: new Date() } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return apiError(500, "撤销失败")
  }
}
