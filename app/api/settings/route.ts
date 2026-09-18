import { NextRequest, NextResponse } from "next/server"
import { revalidateTag, revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { apiError, apiZodError } from "@/lib/api-utils"
import { settingsSchema } from "@/lib/schemas"
import { passwordChangeRequired } from "@/lib/auth"
import { requireSessionOrBearer } from "@/lib/app-auth"
import { SETTINGS_DEFAULTS } from "@/lib/settings"

// GET 为公开读接口：加 CDN 缓存，避免每次请求都打库
const GET_CACHE = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" }

export async function GET() {
  try {
    // P2-6：GET 不再承担写副作用。旧实现在查不到单例时直接 create，
    // 使一个幂等的读接口因预取/爬虫/健康检查而产生写库行为。
    // 单例初始化交由 prisma/seed.ts 负责；此处未命中则返回只读默认值。
    const s = await prisma.setting.findUnique({ where: { id: "singleton" } })
    return NextResponse.json(s ?? { id: "singleton", ...SETTINGS_DEFAULTS }, { headers: GET_CACHE })
  } catch (e) {
    console.error(e)
    return apiError(500, "设置加载失败")
  }
}

export async function PUT(req: NextRequest) {
  const gate = await requireSessionOrBearer(req)
  if (!gate) return apiError(401, "未登录")
  if (gate.kind === "session" && passwordChangeRequired(gate.session)) return apiError(403, "请先修改默认密码")
  try {
    // zod 白名单：未声明字段直接剥离（后端审查 P1-3）。白名单以 lib/schemas.ts 的
    // settingsSchema 为唯一事实源，此处不再维护第二份字段列表（旧的 ALLOWED_FIELDS 已删）。
    const parsed = settingsSchema.safeParse(await req.json())
    if (!parsed.success) return apiZodError(parsed.error)
    const safeData: any = parsed.data
    if (Object.keys(safeData).length === 0) return apiError(400, "无有效字段")
    const s = await prisma.setting.upsert({ where: { id: "singleton" }, update: safeData, create: { id: "singleton", ...safeData } })
    // 设置已被 layout metadata / Header / Footer / manifest 消费（lib/settings.ts）——
    // 保存后立即失效缓存并按 layout 级刷新全站路由，改动即时可见
    revalidateTag("settings")
    revalidatePath("/", "layout")
    return NextResponse.json(s)
  } catch (e: any) {
    console.error(e)
    return apiError(500, "更新失败")
  }
}
