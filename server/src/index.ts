/**
 * Render backend — runs campaign generation graph (no timeout limits).
 * Listen on PORT; CORS for frontend; JSON body limit 50mb.
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleGenerateCampaign } from "./routes/campaign";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json({ limit: "50mb" }));

app.post("/generate-campaign", handleGenerateCampaign);

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Campaign API listening on port ${PORT}`);
});
