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
   ```

   Optional (brand-aware enrichment and creatives):

   ```env
   CLEARBIT_API_KEY=...   # Company name, logo, industry, size, location
   SERPAPI_KEY=...        # YouTube creatives + Google Trends interest over time
   ```

   Optional (analysis history):

   ```env
   DATABASE_URL=postgresql://user:pass@localhost:5432/brand_intelligence
   ```

3. **Open** [http://localhost:3000](http://localhost:3000), enter a brand or domain (e.g. `Stripe`, `nike.com`), and click **Analyze**.

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
