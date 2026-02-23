/**
 * Configured OpenAI client for the app.
 */

import OpenAI from "openai";

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return key;
}

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) _client = new OpenAI({ apiKey: getApiKey() });
  return _client;
}
