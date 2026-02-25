# Analyze Brand — Async Job & Polling

POST `/api/analyze-brand` returns immediately with `{ jobId, status: "pending" }`. Poll GET `/api/analyze-brand/[jobId]` until `status` is `completed` or `failed`, then use `result` or `error`.

## Example: Frontend polling snippet

```ts
import type { AnalyzeBrandResponse } from "@/types";

type PollResponse = {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: AnalyzeBrandResponse;
  error?: string;
};

async function analyzeBrandAndWait(brand: string): Promise<{
  result?: AnalyzeBrandResponse;
  error?: string;
}> {
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

  const poll = async (): Promise<PollResponse> => {
    const r = await fetch(`/api/analyze-brand/${jobId}`);
    if (!r.ok) return { jobId, status: "failed", error: r.statusText };
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

- Set `INNGEST_SIGNING_KEY` and `INNGEST_EVENT_KEY` in Netlify env.
- Point Inngest Cloud to your deployed base URL; the serve handler is at `/api/inngest`.
