import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const hash = await bcrypt.hash("admin123", 10);
console.log("hash", hash.slice(0,20)+"...");

const user = await prisma.user.upsert({
  where: { username: "admin" },
  update: { password: hash, name: "Yahajiang", isDefault: true },
  create: { username: "admin", password: hash, name: "Yahajiang", isDefault: true },
});
console.log("upsert", user.username, user.name, user.isDefault);

const users = await prisma.user.findMany();
console.log("all users", users.map(u=>u.username).join(","));

await prisma.$disconnect();
