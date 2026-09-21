import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import { apiError, apiZodError } from "@/lib/api-utils"
import { appTokenExchangeSchema } from "@/lib/schemas"
import { prisma } from "@/lib/prisma"
import { sha256Hex } from "@/lib/app-auth"
import { verifyCredentials } from "@/lib/auth"

export const dynamic = "force-dynamic"

/**
 * POST /api/app/auth/token —— 用管理员邮箱 + 密码换取一枚 App API Token。
 *
 * ## 为什么需要这条接口（此前是死锁）
 * `/api/app/tokens` 的 POST 虽然已放宽成 `requireSessionOrBearer`，但**首枚**
 * Token 仍然只能先在浏览器里登录 Web 后台手动创建、再把明文粘进 App ——
 * 一个「要打开 App 才能配置的东西，得先在浏览器里配好」。对单管理员的
 * 个人站点，这条链路唯一的实际作用就是让用户多走一趟。
 *
 * 有了这条接口，App 里「输一次账号密码 → 自动拿到并保存 Token」，
 * 之后所有请求都走 Bearer，不再需要浏览器参与。
 *
 * ## 安全设计（这条接口公开可达，必须逐条守住）
 * 1. **凭据校验与限流完全复用 Web 登录那一份**
 *    （`verifyCredentials` ⇒ 双维度计数 + 渐进延迟 + IP 硬闸）。
 *    另写一套「看起来一样」的实现是本接口最大的风险点。
 * 2. **失败文案不区分「账号不存在」与「密码错误」** —— 不给枚举探测的反馈。
 * 3. **默认密码不签发长期凭据**：与 Web 侧一致，`needsPasswordChange`
 *    直接 403，要求先去 Web 改密（改密会顺带撤销全部旧 Token）。
 * 4. **明文只出现这一次**：与 `/api/app/tokens` POST 同规矩，库里只存
 *    SHA-256 hex，列表接口永不回显。
 * 5. `Cache-Control: no-store` —— 响应体里有明文凭据，不许任何层缓存。
 *
 * ## 同名令牌只保留最新一枚
 * 每次「自动获取」都会签发新 Token。若不管，反复换设备/重装会在令牌列表里
 * 堆一排同名的死记录。这里按 `name`（App 传设备标签）去重：**同名旧令牌
 * 置为已撤销**，只留刚签发的这枚。手动在 Web 创建的令牌不受影响。
 *
 * 顺序是**先建后撤**：撤销那步万一失败，用户手里仍有一枚可用 Token，
 * 最坏只多留一条记录；反过来先撤后建一旦失败，就把用户锁在门外了。
 */
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError(400, "请求体必须是 JSON")
  }
  const parsed = appTokenExchangeSchema.safeParse(body)
  if (!parsed.success) return apiZodError(parsed.error)

  const check = await verifyCredentials(parsed.data.email, parsed.data.password, req)
  if (!check.ok) {
    return apiError(
      401,
      check.reason === "rate_limited" ? "尝试过于频繁，请稍后再试" : "邮箱或密码不正确",
    )
  }
  if (check.needsPasswordChange) return apiError(403, "请先在 Web 端修改默认密码")

  const token = randomBytes(32).toString("hex")
  const label = (parsed.data.name?.trim() || DEFAULT_TOKEN_NAME).slice(0, 60)

  const created = await prisma.apiToken.create({
    data: { name: label, tokenHash: sha256Hex(token) },
    select: { id: true, name: true, createdAt: true },
  })

  try {
    await prisma.apiToken.updateMany({
      where: { name: label, revokedAt: null, id: { not: created.id } },
      data: { revokedAt: new Date() },
    })
  } catch (e) {
    // 已签发成功，这一步只是清理，失败不该让用户拿不到 Token
    console.error("[app/auth/token] 撤销同名旧令牌失败", e)
  }

  return NextResponse.json(
    { ...created, token },
    { headers: { "Cache-Control": "no-store" } },
  )
}

/** App 未提供设备标签时的默认令牌名（同时也是 App 端去重用的键）。 */
const DEFAULT_TOKEN_NAME = "App 自动登录"
