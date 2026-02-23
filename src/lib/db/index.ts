/**
 * Database client and helpers. Uses PostgreSQL; pgvector setup present for later.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { analyses } from "./schema";
import type { AnalyzeBrandResponse } from "@/types";

const connectionString = process.env.DATABASE_URL;

function getDb() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return drizzle(postgres(connectionString, { max: 1 }));
}

export interface SaveAnalysisInput {
  brandInput: string;
  normalizedBrand: string;
  domain: string;
  result: AnalyzeBrandResponse;
}

export async function saveAnalysis(input: SaveAnalysisInput): Promise<void> {
  const db = getDb();
  await db.insert(analyses).values({
    brandInput: input.brandInput,
    normalizedBrand: input.normalizedBrand,
    domain: input.domain,
    result: input.result as unknown as Record<string, unknown>,
  });
}

export { analyses } from "./schema";
