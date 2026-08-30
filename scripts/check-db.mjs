import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const rows = await prisma.post.findMany({ orderBy: { date: "desc" } });
console.log("db count", rows.length);
console.log(rows.map((r) => r.id).join(","));
await prisma.$disconnect();
