import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const cats = await prisma.category.findMany({ include: { _count: { select: { posts: true } } }, orderBy: { createdAt: "asc" } })
  return NextResponse.json(cats)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  if (!body.name || !body.slug) return NextResponse.json({ error: "名称和slug必填" }, { status: 400 })
  const cat = await prisma.category.create({ data: { name: body.name, nameZh: body.nameZh, slug: body.slug, description: body.description, coverImageUrl: body.coverImageUrl } })
  return NextResponse.json(cat)
}
