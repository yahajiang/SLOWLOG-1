import "dotenv/config"
import { PrismaClient } from "../lib/generated/prisma/client"

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  console.log("Users in database:", users.length)
  users.forEach(u => console.log(`  - email: ${u.email}, name: ${u.name}, id: ${u.id}`))
  await prisma.$disconnect()
}

main().catch(console.error)
