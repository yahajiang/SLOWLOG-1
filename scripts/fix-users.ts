import "dotenv/config"
import { PrismaClient } from "../lib/generated/prisma/client"

const prisma = new PrismaClient()

// 无损修复：把存量用户邮箱统一小写（登录查询会小写化输入，
// 历史数据中的大写邮箱如 Yahajiang@slowlog.dev 会导致登录失败）
async function main() {
  const users = await prisma.user.findMany()
  for (const u of users) {
    const normalized = u.email.toLowerCase().trim()
    if (normalized !== u.email) {
      await prisma.user.update({ where: { id: u.id }, data: { email: normalized } })
      console.log(`Normalized: ${u.email} -> ${normalized}`)
    }
  }
  const remaining = await prisma.user.findMany()
  console.log("Users now:", remaining.map((u) => u.email))
  await prisma.$disconnect()
}

main().catch(console.error)
