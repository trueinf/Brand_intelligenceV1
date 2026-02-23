/**
 * Prisma client singleton for server-side use.
 * Lazy-initialized so Next.js build (page data collection) does not instantiate
 * PrismaClient, avoiding Prisma 7 "client" engine constructor validation when
 * no adapter/accelerateUrl is set at build time.
 * Run: npx prisma generate
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrisma(): PrismaClient {
  const client =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

/** Lazy singleton; call only at request time so Prisma is not instantiated during Next.js build. */
export function getPrisma(): PrismaClient {
  return globalForPrisma.prisma ?? createPrisma();
}
