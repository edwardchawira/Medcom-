import { createOpenAI } from "@ai-sdk/openai";

export function shouldUseAiFallback() {
  return process.env.NODE_ENV !== "production";
}

export function getOpenAIModel(model: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  const openai = createOpenAI({ apiKey });
  return openai(model);
}
