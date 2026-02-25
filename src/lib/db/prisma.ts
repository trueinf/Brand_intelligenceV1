/**
 * Re-export the shared Prisma singleton. Use import { prisma } from "@/lib/prisma" elsewhere.
 */
export { prisma } from "@/lib/prisma";
import { prisma } from "@/lib/prisma";

/** @deprecated Use `import { prisma } from "@/lib/prisma"` instead. */
export function getPrisma() {
  return prisma;
}
