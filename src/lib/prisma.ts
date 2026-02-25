import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getDatabaseUrl } from "@/lib/db/database-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const connectionString = getDatabaseUrl();
  const adapter = new PrismaPg({ connectionString });
  const client = new PrismaClient({
    adapter,
    log: ["error"],
  });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

/** Lazy singleton: connects on first use so Netlify build (no DB) doesn't run DATABASE_URL checks. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getClient() as unknown as Record<string, unknown>)[prop as string];
  },
});
