let _prisma: any = null;

function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL
  );
}

export function hasDatabase(): boolean {
  return !!getDatabaseUrl();
}

export const prisma: any = new Proxy({} as any, {
  get(_target, prop) {
    if (!hasDatabase()) {
      throw new Error("DATABASE_URL not set, use file fallback");
    }
    if (!_prisma) {
      const { PrismaClient } = require("@prisma/client");
      const { PrismaPg } = require("@prisma/adapter-pg");
      const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
      _prisma = new PrismaClient({ adapter });
      if (process.env.NODE_ENV !== "production") (global as any).prisma = _prisma;
    }
    return _prisma[prop];
  },
});
