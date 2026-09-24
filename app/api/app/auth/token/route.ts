import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import bcrypt from "bcryptjs"
import { apiError, apiZodError } from "@/lib/api-utils"
import { appTokenExchangeSchema } from "@/lib/schemas"
import { prisma } from "@/lib/prisma"
import { canReadUnpublished, ROLE_READER, sha256Hex, tokenExpiry, TOKEN_SCOPE_ADMIN } from "@/lib/app-auth"
import { normalizeLoginEmail, verifyCredentials } from "@/lib/auth"

export const dynamic = "force-dynamic"

/**
 * POST /api/app/auth/token —— 用管理员邮箱 + 密码换取一枚 App API Token。
 *
 * ## 为什么需要这条接口（此前是死锁）
 * `/api/app/tokens` 现在要求管理凭据，而**首枚**管理凭据不可能从那里拿到：
 * 它只能先在浏览器里登录 Web 后台手动创建、再把明文粘进 App ——
 * 一个「要打开 App 才能配置的东西，得先在浏览器里配好」。对单管理员的
 * 个人站点，这条链路唯一的实际作用就是让用户多走一趟。
 *
 * 有了这条接口，App 里「输一次账号密码 → 自动拿到并保存 Token」，
 * 之后所有请求都走 Bearer，不再需要浏览器参与。
 *
 * ## 用途分级（2026-09-21）：`scope` 决定这枚令牌能做什么
 * 这条接口同时服务两条**语义完全不同**的路径，靠请求体里的 `scope` 区分：
 *
 * | 入口 | scope | 能做什么 |
 * |---|---|---|
 * | 读者设置页「自动获取令牌」 | `sync`（**缺省值**） | 只读同步内容（含草稿/正文） |
 * | 后台登录页「验证并进入」 | `admin` | 后台写接口（文章/分类/随想/设置/媒体/令牌） |
 *
 * 缺省给 `sync` 是刻意的：设置页那条路径**根本不需要**写权限，
 * 它的令牌会长期躺在手机上，只该能读。写权限必须显式索取。
 * 两者有效期也不同（同步 90 天 / 管理 7 天），见 `lib/app-auth.ts`。
 *
 * ⚠️ 顺带修掉的一个真实隐患：此前 App 里只有一枚令牌槽位，
 * 「后台登录」会**覆盖**掉读者设置页刚存好的同步令牌。分开两枚后，
 * 两个入口互不干扰，可以各自独立撤销。
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
 * 6. **自动注册只能建只读账号**（2026-09-25，请求体 `register: true`）：
 *    - 只有 `scope: "sync"` 能带 `register`（schema 层就拒 admin+register 的组合）；
 *    - 建出的 `User.role` 恒为 `reader`，客户端无法指定角色；
 *    - 只在「该邮箱确实没有账号」时建号 —— 已有账号的密码不可能被注册请求改写；
 *    - `reader` 拿不到管理凭据（本文件），进不了后台（`requireAdminAuth`），
 *      同步也只看到已发布内容（`/api/app/sync`）。
 *    残留风险：注册没有独立限流（复用登录的 IP 硬闸只对**失败**计数，注册是成功路径）。
 *    可接受的边界：注册成功也只是一个能读公开内容的账号 —— 与匿名访客打开网站、
 *    订阅 RSS 能看到的同量，攻击收益是垃圾数据行，不是内容泄漏。
 *
 * ## 同名令牌只保留最新一枚（去重键是 `name` + `scope`）
 * 每次「自动获取」都会签发新 Token。若不管，反复换设备/重装会在令牌列表里
 * 堆一排同名的死记录。这里按 `name`（App 传设备标签）去重：**同名旧令牌
 * 置为已撤销**，只留刚签发的这枚。手动在 Web 创建的令牌不受影响。
 *
 * ⚠️ **去重必须带上 `scope`**：App 端两个入口传的标签是同一个
 * （`App 自动登录 · <机型>`），若只按 `name` 去重，进一次后台就会把
 * 同步令牌撤掉 —— 用户随后会发现「离线阅读突然要重新配置」。
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

  const { email, password, scope, register } = parsed.data

  // ── 身份：先走登录校验；登录不上且请求明确允许注册时，才建一个只读账号 ──
  const check = await verifyCredentials(email, password, req)
  const failure = check.ok ? null : check.reason
  let principal: { id: string; role: string } | null = check.ok
    ? { id: check.id, role: check.role }
    : null
  const needsPasswordChange = check.ok ? check.needsPasswordChange : false

  if (!principal && register) {
    // 注册**只发生在「这个邮箱确实没有账号」时**。verifyCredentials 刻意把
    // 「账号不存在」与「密码错误」塌缩成同一个 invalid（防枚举），所以这里必须
    // 自己查一次存在性 —— 已有账号绝不能被一个带 register 的请求改掉密码。
    const mail = normalizeLoginEmail(email)
    const exists = await prisma.user.findFirst({
      where: { email: { equals: mail, mode: "insensitive" } },
      select: { id: true },
    })
    if (!exists) {
      try {
        const u = await prisma.user.create({
          data: { email: mail, password: await bcrypt.hash(password, 10), role: ROLE_READER },
          select: { id: true, role: true },
        })
        principal = { id: u.id, role: u.role }
      } catch (e) {
        // 并发注册撞 email 唯一索引 ⇒ 语义上等同「已存在」，落到下面的 401。
        if ((e as { code?: string }).code !== "P2002") throw e
      }
    }
  }

  if (!principal) {
    return apiError(401, failure === "rate_limited" ? "尝试过于频繁，请稍后再试" : "邮箱或密码不正确")
  }
  if (needsPasswordChange) return apiError(403, "请先在 Web 端修改默认密码")
  if (scope === TOKEN_SCOPE_ADMIN && !canReadUnpublished(principal.role)) {
    // 只读账号即便显式索取管理凭据也拿不到。签发处拦一道，requireAdminAuth
    // 使用时再拦一道 —— 权限判定只写一处、而那处漏了就没有第二道防线。
    return apiError(403, "该账号是只读账号，不能获取后台管理凭据", "forbidden_role")
  }

  const token = randomBytes(32).toString("hex")
  const label = (parsed.data.name?.trim() || DEFAULT_TOKEN_NAME).slice(0, 60)
  const expiresAt = tokenExpiry(scope)

  const created = await prisma.apiToken.create({
    data: { name: label, tokenHash: sha256Hex(token), scope, expiresAt, userId: principal.id },
    select: { id: true, name: true, scope: true, expiresAt: true, createdAt: true },
  })

  try {
    await prisma.apiToken.updateMany({
      // scope 进 where：只撤同用途的同名旧令牌（见上文「去重键」）
      where: { name: label, scope, revokedAt: null, id: { not: created.id } },
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
