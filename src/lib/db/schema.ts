import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

/**
 * Analysis history. Replace mock data with real API later without changing this.
 */
export const analyses = pgTable("analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandInput: text("brand_input").notNull(),
  normalizedBrand: text("normalized_brand").notNull(),
  domain: text("domain").notNull(),
  result: jsonb("result").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// pgvector: uncomment when ready to use embeddings
// import { vector } from "pgvector/drizzle-orm";
// export const analysisEmbeddings = pgTable("analysis_embeddings", {
//   id: uuid("id").primaryKey().defaultRandom(),
//   analysisId: uuid("analysis_id").references(() => analyses.id),
//   embedding: vector("embedding", { dimensions: 1536 }),
// });
