import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

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
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const body = await req.json()
    // 白名单过滤：只允许已知字段
    const safeData: any = {}
    for (const key of ALLOWED_FIELDS) {
      if (body[key] !== undefined) safeData[key] = body[key]
    }
    if (Object.keys(safeData).length === 0) return NextResponse.json({ error: "无有效字段" }, { status: 400 })
    const s = await prisma.setting.upsert({ where: { id: "singleton" }, update: safeData, create: { id: "singleton", ...safeData } })
    return NextResponse.json(s)
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: "更新失败" }, { status: 500 })
  }
}
