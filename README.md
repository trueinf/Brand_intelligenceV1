# Brand Campaign Intelligence

Phase-2 AI SaaS: **dynamic synthetic marketing intelligence** powered by real brand signals (Clearbit, OpenAI, optional Google Trends & SerpAPI). No SEMrush.

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind, shadcn-style UI, Framer Motion  
- **Backend:** Next.js API routes + server actions  
- **AI:** OpenAI (gpt-4o-mini) for synthetic data, campaign intelligence, and insights  
- **Orchestration:** LangGraph (8-node workflow)  
- **Enrichment:** Clearbit (company), SerpAPI (YouTube, optional Google Trends)  
- **Database:** PostgreSQL (optional); pgvector ready  

## Quick Start

1. **Install and run**

   ```bash
   npm install
   npm run dev
   ```

2. **Environment**

   Create `.env` or `.env.local`:

   ```env
   OPENAI_API_KEY=sk-proj-...
   DATABASE_URL=postgresql://...   # Required for Prisma and async jobs (see Neon setup below)
   ```

   Optional (brand-aware enrichment and creatives):

   ```env
   CLEARBIT_API_KEY=...   # Company name, logo, industry, size, location
   SERPAPI_KEY=...        # YouTube creatives + Google Trends interest over time
   ```

   **Database:** Use a hosted PostgreSQL (e.g. [Neon](#neon-setup)) for local dev and production. The app uses `process.env.DATABASE_URL` only (no hardcoded URLs). On Netlify, the app throws if `DATABASE_URL` is missing or points to localhost.

3. **Open** [http://localhost:3000](http://localhost:3000), enter a brand or domain (e.g. `Stripe`, `nike.com`), and click **Analyze**.

---

## Neon setup

1. Create a project at [neon.tech](https://neon.tech) and create a database.
2. Copy the connection string (e.g. `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`).
3. **Local:** Add to `.env`:
   ```env
   DATABASE_URL=postgresql://neondb_owner:xxx@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Run migrations:
   ```bash
   npx prisma db push
   # or
   npx prisma migrate deploy
   ```
5. **Production:** Set the same `DATABASE_URL` in Netlify (see below). Do not use a localhost URL in production.

---

## Netlify environment variables

Set these in **Site settings → Environment variables** (or in `netlify.toml` / Netlify UI):

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g. Neon). Must not be localhost in production. |
| `INNGEST_SIGNING_KEY` | Yes (if using Inngest) | From [Inngest Cloud](https://app.inngest.com); used to verify webhooks. |
| `INNGEST_EVENT_KEY` | Yes (if using Inngest) | From Inngest Cloud; used to send events. |
| `OPENAI_API_KEY` | Yes | For LLM and synthetic data. |
| `FAST_ANALYSIS` | Optional | Set to `true` to use the fast analysis path (e.g. on Netlify). |
| `CLEARBIT_API_KEY` | Optional | Company enrichment. |
| `SERPAPI_KEY` | Optional | YouTube creatives, Google Trends. |

After adding or changing variables, trigger a new deploy so the build and serverless functions use the updated values.

## LangGraph Flow (Phase-2)

1. **brand_input_node** – Normalize input to `{ brand_name, domain }`  
2. **clearbit_enrichment_node** – Fetch company data (name, logo, industry, employees, location) → `brand_context`  
3. **synthetic_data_node** – OpenAI generates realistic marketing dataset (domain_overview, channel_mix, keywords, competitors, traffic_trend, campaign_timeline) from brand context  
4. **google_trends_node** – Optional: interest over time for brand → enriches `traffic_trend`  
5. **serpapi_node** – Optional: YouTube videos for brand → `youtube_creatives`  
6. **campaign_intelligence_node** – OpenAI groups data into campaigns  
7. **insight_generation_node** – OpenAI produces insights (maturity, channel strategy, geo opportunities, content focus)  
8. **response_formatter_node** – UI-ready JSON  

All synthetic data comes from OpenAI based on real brand context; no hardcoded values. Nodes remain swappable for real APIs later.

## UI

- **Header:** Brand logo, industry, company size, country (from Clearbit when available)  
- **Traffic trend:** Dynamic chart from synthetic data or Google Trends  
- **Left:** Campaign cards (name, type, success score)  
- **Center:** Campaign detail, campaign timeline, Active Campaign Creatives (YouTube)  
- **Right:** Marketing maturity, channel mix donut, top geo opportunity, strategic recommendation, full insights  
- **Progressive loading:** Brand header first, then campaigns, then insights  

## Project Structure

- `src/agents/` – Brand input, mock data (fallback), synthetic data, campaign, insight  
- `src/langgraph/` – State, nodes, graph  
- `src/lib/clearbit.ts` – Company enrichment by domain  
- `src/lib/google-trends.ts` – Interest over time (SerpAPI)  
- `src/lib/serpapi.ts` – YouTube search for creatives  
- `src/lib/claude/` – LLM client (OpenAI)  
- `src/lib/langgraph/` – Workflow execution  
- `src/components/dashboard/` – Brand header, charts, timeline, maturity, geo, etc.  
- `src/components/cards/` – Campaign, insight, YouTube creatives  
- `src/app/api/analyze-brand/` – POST API route  

## Deliverable

User searches any real brand → system becomes brand-aware (Clearbit) → OpenAI generates realistic multi-channel marketing intelligence → UI shows dynamic growth chart, channel mix, maturity level, real YouTube creatives (when SerpAPI key set), and AI campaign strategy.
