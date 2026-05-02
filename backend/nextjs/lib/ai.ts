import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { requireEnv } from "./env";

export const google = createGoogleGenerativeAI({
  apiKey: requireEnv("GEMINI_API_KEY"),
});
