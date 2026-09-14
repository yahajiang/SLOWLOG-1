// CI/本地集成测试夹具：创建测试账户（仅供测试，绝不触碰真实管理员）
// 守卫：DATABASE_URL 指向本地/CI 时才允许运行；对生产库请显式 ALLOW_FIXTURES=1
// 用法：node --env-file=.env scripts/api-tests-fixtures.mjs
import "dotenv/config"
import { PrismaClient } from "../lib/generated/prisma/client.js"
import bcrypt from "bcryptjs"

const url = process.env.DATABASE_URL || ""
if (!/localhost|127\.0\.0\.1/.test(url) && process.env.ALLOW_FIXTURES !== "1") {
  console.error("[fixtures] 拒绝：DATABASE_URL 非本地/CI 环境。如确需对远端库运行：ALLOW_FIXTURES=1")
  process.exit(1)
}

const prisma = new PrismaClient()

async function main() {
  const users = [
    // 登录限流场景专用（会被锁 15 分钟，测试后由 fixtures 重跑复位）
    { email: "rate-user@test.local", password: "RatePass123", name: "CI Rate" },
    // 改密场景专用（改完 fixtures 重跑即复位）
    { email: "change-user@test.local", password: "ChangePass123", name: "CI Change" },
    // 写操作场景专用（草稿/定时/上传），替代真实管理员执行写请求
    { email: "test-admin@test.local", password: "TestAdmin123", name: "CI Admin" },
  ]
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10)
    await prisma.user.upsert({
      where: { email: u.email },
      update: { password: hash, name: u.name },
      create: { email: u.email, password: hash, name: u.name },
    })
    console.log(`  user ready: ${u.email} / ${u.password}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
