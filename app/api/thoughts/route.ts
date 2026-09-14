import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { apiError, apiZodError } from "@/lib/api-utils"
import { thoughtSchema } from "@/lib/schemas"
import { auth, passwordChangeRequired } from "@/lib/auth"

const getCachedThoughts = unstable_cache(
  async () => {
    const rows = await prisma.note.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
    return rows.map((doc) => ({
      id: doc.id,
      text: doc.content || "",
      textZh: doc.contentZh || doc.content || "",
      content: doc.content || "",
      contentZh: doc.contentZh || doc.content || "",
      time: "just now",
      timeZh: "刚刚",
      createdAt: doc.createdAt,
    }));
  },
  ["thoughts-all"],
  { revalidate: 30, tags: ["thoughts"] }
)

export async function GET() {
  try {
    const thoughts = await getCachedThoughts()
    return NextResponse.json(thoughts);
  } catch (error) {
    console.error(error);
    return apiError(500, "随想加载失败");
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return apiError(401, "未登录")
  if (passwordChangeRequired(session)) return NextResponse.json({ error: "请先修改默认密码" }, { status: 403 })
  try {
    const parsed = thoughtSchema.safeParse(await req.json());
  if (!parsed.success) return apiZodError(parsed.error)
  const body = parsed.data
    const text = body.textZh || body.text || body.content || ""
    if (!text || text.length > 500) return apiError(400, "内容需 1-500 字")
    const doc = await prisma.note.create({ data: { content: text, contentZh: body.textZh || text } })
    revalidateTag("thoughts")
    revalidatePath("/")
    revalidatePath("/m")
    return NextResponse.json({ id: doc.id, text: doc.content, textZh: doc.contentZh, createdAt: doc.createdAt })
  } catch (e) {
    console.error(e)
    return apiError(500, "创建失败")
  }
}
