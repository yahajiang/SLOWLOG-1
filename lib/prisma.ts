let _prisma: any = null;
let _prismaPromise: Promise<any> | null = null;

function getDatabaseUrl(): string | undefined {
  const direct =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL ||
    (process.env as any)["贮存_URL"] ||
    process.env.STORAGE_URL;
  if (direct) return direct;
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

async function initPrisma() {
  if (_prisma) return _prisma;
  if (!_prismaPromise) {
    _prismaPromise = (async () => {
      const { PrismaClient } = await import("@prisma/client");
      const { PrismaPg } = await import("@prisma/adapter-pg");
      const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
      const client = new PrismaClient({ adapter });
      if (process.env.NODE_ENV !== "production") (global as any).prisma = client;
      _prisma = client;
      return client;
    })();
  }
  return _prismaPromise;
}

export const prisma: any = new Proxy({} as any, {
  get(_target, prop) {
    if (!hasDatabase()) {
      throw new Error("DATABASE_URL not set, use file fallback");
    }
    // Return a proxy that awaits the initialization
    return new Proxy({}, {
      get(_t, p) {
        if (p === Symbol.toPrimitive) return () => "[object PrismaProxy]";
        return (...args: any[]) => initPrisma().then((c: any) => c[prop](...args));
      },
    });
  },
});
