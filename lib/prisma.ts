let _prisma: any = null;

export function hasDatabase(): boolean {
  return !!process.env.DATABASE_URL;
}

export const prisma: any = new Proxy({} as any, {
  get(_target, prop) {
    if (!hasDatabase()) {
      throw new Error("DATABASE_URL not set, use file fallback");
    }
    if (!_prisma) {
      const { PrismaClient } = require("@prisma/client");
      const { PrismaPg } = require("@prisma/adapter-pg");
      const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
      _prisma = new PrismaClient({ adapter });
      if (process.env.NODE_ENV !== "production") (global as any).prisma = _prisma;
    }
    return _prisma[prop];
  },
});
