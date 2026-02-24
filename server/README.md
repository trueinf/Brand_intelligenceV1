# Campaign API (Render backend)

Express server that runs `runCampaignGenerationGraph()` with **no timeout limits**. The Netlify frontend proxies `POST /api/generate-campaign` to this service.

## Run locally

From **project root** (so the graph and `@/` paths resolve):

```bash
npm run server
```

Runs with `ts-node` and `tsconfig-paths`; listens on `PORT` (default 3001).

## Environment (backend)

Set in Render dashboard or in a `.env` file at **project root** when running locally:

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | — | Set by Render (e.g. 10000). Default 3001 locally. |
| `OPENAI_API_KEY` | Yes | Used by campaign strategist, creative prompts, ad image generation. |
| `CORS_ORIGIN` | — | Allowed origin (e.g. `https://brandinteligence.netlify.app`). Omit or `true` to allow all. |
| `LANGCHAIN_API_KEY` | — | Optional (LangSmith). |
| Any keys used by graph nodes | — | e.g. XAI_API_KEY for ad video (xAI Grok Imagine Video); see `src/langgraph/campaign-generation-nodes.ts`. |

## Deploy on Render

1. **New Web Service** → connect this repo.
2. **Build**
   - Build command: `npm install`
   - No need to build Next.js.
3. **Start**
   - Start command: `npm run server`
   - Must run from **repo root** so `server/src` and `src/langgraph` are available.
4. **Environment**
   - Add `OPENAI_API_KEY`, `CORS_ORIGIN` (your Netlify URL), and any other keys the graph needs.
5. **Health**
   - `GET /health` returns `{ "ok": true }`.

## Frontend (Netlify)

In Netlify (or `.env`), set:

- `NEXT_PUBLIC_CAMPAIGN_API_URL=https://your-render-service.onrender.com`  
  (no trailing slash)

Then `POST /api/generate-campaign` on the frontend will proxy to the Render backend and return the same `{ brief, adImages, videoUrl }` JSON.
