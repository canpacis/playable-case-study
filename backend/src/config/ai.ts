import OpenAI from "openai";

export function initAiClient() {
  return new OpenAI();
}
