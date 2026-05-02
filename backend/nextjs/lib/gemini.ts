import { GoogleGenAI, ThinkingLevel as GeminiThinkingLevel } from "@google/genai";
import { z, type ZodType } from "zod";

import {
  dataStorySchema,
  inspirationRescueSchema,
  logicCompassSchema,
  type DataStoryOutput,
  type DataStoryRequest,
  type InspirationRequest,
  type InspirationRescueOutput,
  type LogicCompassOutput,
  type LogicCompassRequest,
} from "./ai-schemas";
import { optionalEnv, requireEnv } from "./env";
import {
  buildDataStoryUserPrompt,
  buildInspirationUserPrompt,
  buildLogicCompassUserPrompt,
  dataStorySystemPrompt,
  inspirationSystemPrompt,
  logicCompassSystemPrompt,
} from "./prompts";

type BalboThinkingLevel = "minimal" | "low" | "medium" | "high";

export type GeminiUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type GeminiResult<T> = {
  output: T;
  modelName: string;
  latencyMs: number;
  usage: GeminiUsage;
  rawResponse: unknown;
};

let ai: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: requireEnv("GEMINI_API_KEY") });
  }

  return ai;
}

async function generateStructured<T>({
  modelName,
  systemInstruction,
  userPrompt,
  schema,
  thinkingLevel,
}: {
  modelName: string;
  systemInstruction: string;
  userPrompt: string;
  schema: ZodType<T>;
  thinkingLevel: BalboThinkingLevel;
}): Promise<GeminiResult<T>> {
  const startedAt = Date.now();
  const response = await getGeminiClient().models.generateContent({
    model: modelName,
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(schema),
      thinkingConfig: {
        thinkingLevel: toGeminiThinkingLevel(thinkingLevel),
      },
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return {
    output: schema.parse(JSON.parse(text)),
    modelName,
    latencyMs: Date.now() - startedAt,
    usage: normalizeUsage(response),
    rawResponse: response,
  };
}

export function generateInspirationRescue(
  input: InspirationRequest,
): Promise<GeminiResult<InspirationRescueOutput>> {
  return generateStructured({
    modelName:
      optionalEnv("GEMINI_INSPIRATION_MODEL") ??
      "gemini-3.1-flash-lite-preview",
    systemInstruction: inspirationSystemPrompt,
    userPrompt: buildInspirationUserPrompt(input),
    schema: inspirationRescueSchema,
    thinkingLevel: "low",
  });
}

export function generateDataStory(
  input: DataStoryRequest,
): Promise<GeminiResult<DataStoryOutput>> {
  return generateStructured({
    modelName: optionalEnv("GEMINI_DATA_STORY_MODEL") ?? "gemini-3-flash-preview",
    systemInstruction: dataStorySystemPrompt,
    userPrompt: buildDataStoryUserPrompt(input),
    schema: dataStorySchema,
    thinkingLevel: "medium",
  });
}

export function generateLogicCompassReport(
  input: LogicCompassRequest,
): Promise<GeminiResult<LogicCompassOutput>> {
  return generateStructured({
    modelName:
      optionalEnv("GEMINI_LOGIC_COMPASS_MODEL") ?? "gemini-3-flash-preview",
    systemInstruction: logicCompassSystemPrompt,
    userPrompt: buildLogicCompassUserPrompt(input),
    schema: logicCompassSchema,
    thinkingLevel: "high",
  });
}

export async function embedForRetrieval(content: string, title = "none") {
  const response = await getGeminiClient().models.embedContent({
    model: optionalEnv("GEMINI_EMBEDDING_MODEL") ?? "gemini-embedding-2",
    contents: `title: ${title} | text: ${content}`,
    config: {
      outputDimensionality: 768,
    },
  });

  return response.embeddings?.[0]?.values ?? [];
}

function normalizeUsage(response: unknown): GeminiUsage {
  const usage = (response as { usageMetadata?: Record<string, unknown> })
    .usageMetadata;

  if (!usage) return {};

  return {
    inputTokens: numberOrUndefined(usage.promptTokenCount),
    outputTokens: numberOrUndefined(usage.candidatesTokenCount),
    totalTokens: numberOrUndefined(usage.totalTokenCount),
  };
}

function numberOrUndefined(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function toGeminiThinkingLevel(level: BalboThinkingLevel) {
  const levels: Record<BalboThinkingLevel, GeminiThinkingLevel> = {
    minimal: GeminiThinkingLevel.MINIMAL,
    low: GeminiThinkingLevel.LOW,
    medium: GeminiThinkingLevel.MEDIUM,
    high: GeminiThinkingLevel.HIGH,
  };

  return levels[level];
}

export function apiErrorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return "輸入格式不完整，請檢查欄位後再送一次。";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "發生未知錯誤。";
}
