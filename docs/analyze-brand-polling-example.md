# Analyze Brand — Async Job & Polling

1. Call **POST /api/analyze-brand** with `{ brand }`.
2. Poll **GET /api/analyze-brand/{jobId}** until `status === "completed"` (or `"failed"`).
3. Use `result` when completed, or `error` when failed.

## Frontend integration example

```ts
import type { BrandAnalysisResult } from "@/types/analysis";

type PollResponse = {
  status: string;
  result?: BrandAnalysisResult;
  error?: string;
};

async function analyzeBrandAndWait(brand: string): Promise<{
  result?: BrandAnalysisResult;
  error?: string;
}> {
  // 1. Start job
  const res = await fetch("/api/analyze-brand", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brand }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: (err as { error?: string }).error ?? res.statusText };
  }
  const { jobId, status } = (await res.json()) as { jobId: string; status: string };
  if (status !== "pending" || !jobId) return { error: "Invalid response" };

  // 2. Poll until completed
  const poll = async (): Promise<PollResponse> => {
    const r = await fetch(`/api/analyze-brand/${jobId}`);
    if (!r.ok) return { status: "failed", error: r.statusText };
    return r.json() as Promise<PollResponse>;
  };

  for (let i = 0; i < 120; i++) {
    const data = await poll();
    if (data.status === "completed") return { result: data.result };
    if (data.status === "failed") return { error: data.error ?? "Analysis failed" };
    await new Promise((r) => setTimeout(r, 2000));
  }
  return { error: "Timeout waiting for analysis" };
}
```

## Netlify

- Set `DATABASE_URL`, `INNGEST_SIGNING_KEY`, and `INNGEST_EVENT_KEY` in Netlify env.
- Point Inngest Cloud to your deployed base URL; the serve handler is at `/api/inngest`.
