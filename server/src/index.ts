/**
 * Render backend — runs campaign generation graph (no timeout limits).
 * Listen on PORT; CORS for frontend; JSON body limit 50mb.
 * Serves generated images from public/ (creatives, videos) so the frontend can load them.
 */

import "dotenv/config";
import path from "path";
import express from "express";
import cors from "cors";
import { handleGenerateCampaign } from "./routes/campaign";

const app = express();
const PORT = process.env.PORT ?? 3001;

const corsOrigin = process.env.CORS_ORIGIN?.trim();
const corsOriginNormalized = corsOrigin
  ? corsOrigin.replace(/\/+$/, "")
  : true;

app.use(
  cors({
    origin: corsOriginNormalized,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json({ limit: "50mb" }));

const publicDir = path.join(process.cwd(), "public");
app.use("/creatives", express.static(path.join(publicDir, "creatives")));
app.use("/videos", express.static(path.join(publicDir, "videos")));
app.use("/audio", express.static(path.join(publicDir, "audio")));

app.post("/generate-campaign", handleGenerateCampaign);

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Campaign API listening on port ${PORT}`);
});
