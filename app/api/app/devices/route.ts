import { NextRequest, NextResponse } from "next/server"
import { auth, passwordChangeRequired } from "@/lib/auth"
import { apiError, apiZodError } from "@/lib/api-utils"
import { deviceDeleteSchema, deviceUpsertSchema } from "@/lib/schemas"
import { prisma } from "@/lib/prisma"
import { requireSessionOrBearer } from "@/lib/app-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session) return apiError(401, "未登录")
  if (passwordChangeRequired(session)) return apiError(403, "请先修改默认密码")
  const rows = await prisma.appDevice.findMany({
    orderBy: { lastActive: "desc" },
    select: { id: true, fcmToken: true, platform: true, lastActive: true, createdAt: true },
  })
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const gate = await requireSessionOrBearer(req)
  if (!gate) return apiError(401, "未登录")
  if (gate.kind === "session" && passwordChangeRequired(gate.session)) {
    return apiError(403, "请先修改默认密码")
  }
  const parsed = deviceUpsertSchema.safeParse(await req.json())
  if (!parsed.success) return apiZodError(parsed.error)
  const { fcmToken, platform } = parsed.data
  const row = await prisma.appDevice.upsert({
    where: { fcmToken },
    create: { fcmToken, platform: platform || "android" },
    update: { platform: platform || undefined, lastActive: new Date() },
    select: { id: true, fcmToken: true, platform: true, lastActive: true, createdAt: true },
  })
  return NextResponse.json(row)
}

export async function DELETE(req: NextRequest) {
  const gate = await requireSessionOrBearer(req)
  if (!gate) return apiError(401, "未登录")
  if (gate.kind === "session" && passwordChangeRequired(gate.session)) {
    return apiError(403, "请先修改默认密码")
  }
  const parsed = deviceDeleteSchema.safeParse(await req.json())
  if (!parsed.success) return apiZodError(parsed.error)
  await prisma.appDevice.deleteMany({ where: { fcmToken: parsed.data.fcmToken } })
  return NextResponse.json({ ok: true })
}
