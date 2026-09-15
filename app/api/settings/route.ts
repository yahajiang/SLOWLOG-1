import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiError, apiZodError } from "@/lib/api-utils"
import { settingsSchema } from "@/lib/schemas"
import { auth, passwordChangeRequired } from "@/lib/auth"

/** 与 prisma/schema.prisma 的 Setting 默认值保持一致，用于「单例尚未落库」时的只读兜底 */
const DEFAULT_SETTINGS = {
  id: "singleton",
  siteName: "慢日志",
  siteNameEn: "SlowLog",
  siteDescription: "慢下来，写点值得读的东西。",
  siteDescriptionEn: null,
  siteKeywords: "设计,博客,思考",
  siteIconUrl: null,
  logoUrl: null,
  footerText: null,
  footerTextEn: null,
  socialLinks: [],
  defaultPageConfig: {
    layout: "standard",
    theme: "light",
    primaryColor: "oklch(0.55 0.15 250)",
    fontFamily: "sans",
    backgroundColor: "#FFFFFF",
    maxWidth: "medium",
    showTOC: false,
  },
  postsPerPage: 10,
  theme: "system",
}

// GET 为公开读接口：加 CDN 缓存，避免每次请求都打库
const GET_CACHE = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" }

export async function GET() {
  try {
    // P2-6：GET 不再承担写副作用。旧实现在查不到单例时直接 create，
    // 使一个幂等的读接口因预取/爬虫/健康检查而产生写库行为。
    // 单例初始化交由 prisma/seed.ts 负责；此处未命中则返回只读默认值。
    const s = await prisma.setting.findUnique({ where: { id: "singleton" } })
    return NextResponse.json(s ?? DEFAULT_SETTINGS, { headers: GET_CACHE })
  } catch (e) {
    console.error(e)
    return apiError(500, "设置加载失败")
  }
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
