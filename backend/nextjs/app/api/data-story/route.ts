import type { NextRequest } from "next/server";
import { streamObject } from "ai";

import { google } from "../../../lib/ai";
import { dataStoryRequestSchema, dataStorySchema } from "../../../lib/ai-schemas";
import { getUserIdFromRequest } from "../../../lib/auth";
import { consumeCredits, hasCredits } from "../../../lib/credits";
import {
  dataStorySystemPrompt,
  buildDataStoryUserPrompt,
} from "../../../lib/prompts";
import {
  completeServiceRun,
  createServiceRun,
  failServiceRun,
  recordModelInvocation,
  recordUsageLedger,
} from "../../../lib/service-runs";
import { sendStripeMeterEvent } from "../../../lib/stripe";
import { json } from "../../../lib/http";
import { optionalEnv } from "../../../lib/env";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let runId: string | null = null;

  try {
    const userId = await getUserIdFromRequest(req);
    const input = dataStoryRequestSchema.parse(await req.json());
    const hasServiceCredit = await hasCredits({ userId });

    if (!hasServiceCredit) {
      return json(
        {
          error: "PAYMENT_REQUIRED",
          message: "這個服務需要單次額度，請先完成付款。",
        },
        402,
      );
    }

    runId = await createServiceRun({
      userId,
      service: "data_story_translator",
      billingMode: "metered",
      inputText: input.inputText,
      inputPayload: input,
    });

    const modelName = optionalEnv("GEMINI_DATA_STORY_MODEL") ?? "gemini-1.5-flash";

    const result = await streamObject({
      model: google(modelName),
      schema: dataStorySchema,
      system: dataStorySystemPrompt,
      prompt: buildDataStoryUserPrompt(input),
      onFinish: async ({ object, usage }) => {
        try {
          const totalTokens = usage.totalTokens;
          const creditsValue = Math.max(1, Math.ceil((totalTokens ?? 1000) / 1000));

          const meterEvent = await sendStripeMeterEvent({
            userId,
            value: creditsValue,
            identifier: runId ?? crypto.randomUUID(),
          });

          await completeServiceRun({
            runId,
            outputPayload: object,
          });

          await recordModelInvocation({
            runId,
            result: {
              output: object,
              usage,
              modelName,
            },
            promptVersion: "balbo-data-story-v1-streaming",
          });

          await recordUsageLedger({
            userId,
            runId,
            service: "data_story_translator",
            quantity: creditsValue,
            unit: "k_tokens",
            stripeMeterEventId: meterEvent?.identifier,
          });

          await consumeCredits({ userId });
        } catch (recordingError) {
          console.error("[Streaming Finish Error]", recordingError);
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    if (runId) {
      await failServiceRun({
        runId,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
    // For streaming, we might need a different way to return error if the stream already started,
    // but here we are still in the initial setup.
    return json({ error: error instanceof Error ? error.message : "發生未知錯誤" }, 500);
  }
}
