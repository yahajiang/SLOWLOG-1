import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { apiError, apiZodError } from "@/lib/api-utils"
import { categoryCreateSchema } from "@/lib/schemas"
import { auth, passwordChangeRequired } from "@/lib/auth"
import { publicPostWhere } from "@/lib/posts"

const getCachedCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      // P3-11：只统计已发布文章。旧实现 `posts: true` 会把草稿与未到期的定时文章
      // 一并计入，使公开接口泄漏「站内还有多少未发布内容」这一内部信息。
      include: { _count: { select: { posts: { where: publicPostWhere() } } } },
      orderBy: { createdAt: "asc" },
    })
  },
  ["categories-all"],
  { revalidate: 60, tags: ["categories"] }
)

export async function GET() {
  try {
    const cats = await getCachedCategories()
    return NextResponse.json(cats)
  } catch (e) {
    // P2-7：与其余路由统一错误契约。旧实现无 try/catch，DB 异常时返回框架级 500，
    // 而前端按 data.error 解析会拿到 undefined（其余路由均返回 { error } JSON）
    console.error(e)
    return apiError(500, "分类加载失败")
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return apiError(401, "未登录")
  if (passwordChangeRequired(session)) return NextResponse.json({ error: "请先修改默认密码" }, { status: 403 })
  const parsed = categoryCreateSchema.safeParse(await req.json())
  if (!parsed.success) return apiZodError(parsed.error)
  const body = parsed.data
  // P2-新增：create 的 data 必须与 categoryCreateSchema 的字段一一对应。
  // 旧实现漏了 descriptionZh —— schema 收下了它、create 却没传，于是"英文描述
  // 永远存不进去"（只有 PUT 的 ALLOWED_FIELDS 里有它，先建后改才能写成功）。
  try {
    const cat = await prisma.category.create({
      data: {
        name: body.name,
        nameZh: body.nameZh,
        slug: body.slug,
        description: body.description,
        descriptionZh: body.descriptionZh,
        coverImageUrl: body.coverImageUrl,
      },
    })
    revalidateTag("categories")
    return NextResponse.json(cat)
  } catch (e: any) {
    // 与 PUT/DELETE 对齐：slug 是 @unique，重复创建抛 P2002。旧实现无 try/catch，
    // 未捕获异常会退化成框架级 500，前端按 data.error 解析会拿到 undefined。
    if (e.code === "P2002") return apiError(400, "Slug 已存在")
    console.error(e)
    return apiError(500, "创建失败")
  }
}
