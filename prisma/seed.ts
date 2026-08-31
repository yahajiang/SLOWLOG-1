import "dotenv/config"
import { PrismaClient } from "../lib/generated/prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Categories
  const cats = [
    { name: "Design", nameZh: "设计", slug: "design" },
    { name: "Plugin", nameZh: "插件", slug: "plugin" },
    { name: "Engineering", nameZh: "工程", slug: "engineering" },
    { name: "Typography", nameZh: "字体", slug: "typography" },
    { name: "Frontend", nameZh: "前端", slug: "frontend" },
    { name: "Snippet", nameZh: "点滴", slug: "snippet" },
  ]
  for (const c of cats) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c })
  }
  console.log("Categories seeded")

  // Default user
  const email = "admin@slowlog.dev"
  const hash = await bcrypt.hash("admin123", 10)
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password: hash, name: "Yahajiang" },
  })
  console.log("User seeded: admin@slowlog.dev / admin123 (please change on first login)")

  // Setting singleton
  await prisma.setting.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  })
  console.log("Setting seeded")

  // Demo post if none
  const count = await prisma.post.count()
  if (count === 0) {
    const designCat = await prisma.category.findUnique({ where: { slug: "design" } })
    await prisma.post.create({
      data: {
        title: "Hello SlowLog",
        titleZh: "你好 慢日志",
        slug: "hello-slowlog",
        excerpt: "This is your first post. Edit it in the dashboard.",
        excerptZh: "这是你的第一篇文章，去后台编辑它。",
        content: {
          type: "doc",
          content: [
            { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Welcome" }] },
            { type: "paragraph", content: [{ type: "text", text: "慢下来，写点值得读的东西。" }] },
          ],
        },
        status: "published",
        categoryId: designCat?.id,
        tags: ["SlowLog"],
        featured: false,
        publishedAt: new Date(),
      },
    })
    console.log("Demo post created")
  }

  // Demo note
  const noteCount = await prisma.note.count()
  if (noteCount === 0) {
    await prisma.note.create({ data: { content: "The best interfaces are the ones where you don't notice the interface.", contentZh: "最好的界面是让你感觉不到界面的存在。" } })
  }
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); process.exit(1) })
