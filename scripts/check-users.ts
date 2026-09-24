import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaClient } from "../lib/generated/prisma/client"

const prisma = new PrismaClient()

/**
 * 只读体检：账号列表 + **每行密码能不能比对**。
 *
 * 为什么要后者：`lib/auth.ts` 的 `verifyCredentials` 直接 `bcrypt.compare(输入, 行值)`，
 * 而 bcryptjs 遇到「不是合法 bcrypt 哈希」的值是**抛异常**，不是返回 false ——
 * 表现就是那个账号一登录就 HTTP 500（Web 与 App 同时中）。历史脚本写入的
 * 明文/半截哈希都会落进这一类。
 *
 * 这里对每行做一次**实证**探测：拿一个永远不可能正确的串去 compare，
 * 正常哈希只会返回 false，坏哈希会抛 —— 抛了就是它。全程不写库、不打印哈希。
 */
async function main() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } })
  console.log(`Users in database: ${users.length}\n`)

  const broken: { id: string; email: string }[] = []
  for (const u of users) {
    const raw = u.password ?? ""
    const prefix = raw.slice(0, 4)
    const looksBcrypt = /^\$2[aby]\$/.test(raw)
    let verdict: string
    try {
      await bcrypt.compare("__probe__", raw)
      verdict = looksBcrypt ? "可比对" : `可比对，但前缀异常(${prefix})`
    } catch (e) {
      verdict = `✗ compare 抛错 → 该账号登录必 500：${(e as Error).name}: ${(e as Error).message}`
      broken.push({ id: u.id, email: u.email })
    }
    console.log(
      `  ${u.email.padEnd(34)} name=${u.name ?? "-"}\n` +
        `    id=${u.id}  password: len=${raw.length} prefix=${prefix || "(空)"}  ${verdict}`,
    )
  }

  console.log(
    broken.length === 0
      ? "\nOK：所有账号的密码列都能比对，登录 500 与哈希无关。"
      : `\n需要处理 ${broken.length} 行：${broken.map((b) => b.email).join(", ")}\n` +
        `重置方式：在能登录的账号里用后台改密，或 node -e 生成一枚 bcrypt 哈希后 update 该行。`,
  )
  await prisma.$disconnect()
}

main().catch(console.error)
