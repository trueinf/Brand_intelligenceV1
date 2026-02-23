/**
 * LLM client for structured AI calls. Uses OpenAI (ChatGPT).
 * Temperature 0.2 for consistent marketing intelligence output.
 */

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const getModel = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new ChatOpenAI({
    model: "gpt-4o-mini",
    apiKey,
    maxTokens: 4096,
    temperature: 0.2,
  });
};

export interface StructuredPromptOptions {
  systemPrompt: string;
  userPrompt: string;
  jsonSchema?: string;
}

function normalizeError(e: unknown): Error {
  if (e instanceof Error) {
    const msg = e.message;
    if (msg.includes("insufficient_quota") || msg.includes("credit"))
      return new Error("OpenAI: Insufficient quota or credits. Add payment at platform.openai.com.");
    if (msg.includes("invalid_request_error"))
      return new Error("OpenAI: " + (e.message.match(/"message":"([^"]+)"/)?.[1] ?? e.message));
  }
  if (typeof e === "object" && e !== null && "error" in e) {
    const err = (e as { error?: { message?: string } }).error;
    if (err?.message) return new Error("OpenAI: " + err.message);
  }
  return e instanceof Error ? e : new Error("LLM request failed.");
}

export async function callClaude(options: StructuredPromptOptions): Promise<string> {
  const model = getModel();
  const messages = [
    new SystemMessage(options.systemPrompt),
    new HumanMessage(options.userPrompt),
  ];
  try {
    const response = await model.invoke(messages);
    const content = response.content;
    if (typeof content !== "string") {
      throw new Error("Unexpected non-string response from model");
    }
    return content;
  } catch (e) {
    throw normalizeError(e);
  }
}

export async function callClaudeJson<T>(options: StructuredPromptOptions): Promise<T> {
  const raw = await callClaude(options);
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw.trim();
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    throw new Error("Model did not return valid JSON. Raw: " + raw.slice(0, 500));
  }
}
