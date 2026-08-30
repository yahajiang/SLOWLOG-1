let _prisma: any = null;

function getDatabaseUrl(): string | undefined {
  // Support any _URL env that looks like postgres (covers custom prefix like STORAGE_URL, 贮存_URL)
  const direct =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL ||
    (process.env as any)["贮存_URL"] ||
    process.env.STORAGE_URL;
  if (direct) return direct;
  // Fallback: scan all env vars for postgres neon URL
  for (const [k, v] of Object.entries(process.env)) {
    if (k.endsWith("_URL") && typeof v === "string" && v.includes("postgres") && v.includes("neon.tech")) {
      return v;
    }
  }
  return undefined;
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
