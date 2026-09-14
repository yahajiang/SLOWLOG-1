import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiError, apiZodError } from "@/lib/api-utils"
import { settingsSchema } from "@/lib/schemas"
import { auth, passwordChangeRequired } from "@/lib/auth"

export async function GET() {
  let s = await prisma.setting.findUnique({ where: { id: "singleton" } })
  if (!s) s = await prisma.setting.create({ data: { id: "singleton" } })
  return NextResponse.json(s)
}

const ALLOWED_FIELDS = [
  "siteName", "siteNameEn", "siteDescription", "siteDescriptionEn",
  "siteKeywords", "siteIconUrl", "logoUrl", "footerText", "footerTextEn",
  "socialLinks", "defaultPageConfig", "postsPerPage", "theme",
]

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError(401, "未登录")
  if (passwordChangeRequired(session)) return apiError(403, "请先修改默认密码")
  try {
    // zod 白名单：未声明字段直接剥离（后端审查 P1-3）
    const parsed = settingsSchema.safeParse(await req.json())
    if (!parsed.success) return apiZodError(parsed.error)
    const safeData: any = parsed.data
    if (Object.keys(safeData).length === 0) return apiError(400, "无有效字段")
    const s = await prisma.setting.upsert({ where: { id: "singleton" }, update: safeData, create: { id: "singleton", ...safeData } })
    return NextResponse.json(s)
  } catch (e: any) {
    console.error(e)
    return apiError(500, "更新失败")
  }
}
