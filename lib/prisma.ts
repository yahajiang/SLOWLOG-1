import { PrismaClient } from "./generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrisma() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) return new PrismaClient()
  // Neon + 本机 Windows：内置引擎 TLS 常连不上，走 node-postgres 适配器。
  // ⚠️ 本模块仅可在 Node runtime 引用；middleware/edge 不得 import（pg 依赖 crypto）。
  const pool = new Pool({
    connectionString,
    // TLS 策略：远程（Neon）强制验证证书链（P2-1）；本地/CI 的 postgres 服务无 TLS，走明文
    ssl: /localhost|127\.0\.0\.1/.test(connectionString) ? false : { rejectUnauthorized: true },
    max: 5,
    connectionTimeoutMillis: 15_000,
  })
  return new PrismaClient({ adapter: new PrismaPg(pool) })
}

export const prisma = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
