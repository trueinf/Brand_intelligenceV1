/**
 * Upstash Redis REST client for serverless.
 * Used by the campaign job store for persistent job state.
 * Env is validated on first use so build can succeed without Redis configured.
 */

import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

/** Strip surrounding quotes from env values (fixes ""https://..."" or "https://..." from .env/Netlify). */
function trimQuotes(s: string): string {
  let out = s.trim();
  while (out.length >= 2 && (out.startsWith('"') || out.startsWith("'"))) {
    const q = out[0];
    if (out.endsWith(q)) out = out.slice(1, -1).trim();
    else break;
  }
  return out;
}

export function getRedis(): Redis {
  if (_redis) return _redis;
  const rawUrl = process.env.UPSTASH_REDIS_REST_URL;
  const rawToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!rawUrl || !rawToken) {
    throw new Error(
      "Missing Upstash Redis env: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required."
    );
  }
  const url = trimQuotes(rawUrl);
  const token = trimQuotes(rawToken);
  if (!url.startsWith("https://")) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL must start with https://. Remove any extra quotes in your .env."
    );
  }
  _redis = new Redis({ url, token });
  return _redis;
}
