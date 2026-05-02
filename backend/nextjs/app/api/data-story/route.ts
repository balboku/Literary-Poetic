import type { NextRequest } from "next/server";

import { dataStoryRequestSchema } from "../../../lib/ai-schemas";
import { getUserIdFromRequest } from "../../../lib/auth";
import { consumeCredits, hasCredits } from "../../../lib/credits";
import { generateDataStory } from "../../../lib/gemini";
import { errorJson, json } from "../../../lib/http";
import {
  completeServiceRun,
  createServiceRun,
  failServiceRun,
  recordModelInvocation,
  recordUsageLedger,
} from "../../../lib/service-runs";
import { sendStripeMeterEvent } from "../../../lib/stripe";

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

    const result = await generateDataStory(input);
    const meterEvent = await sendStripeMeterEvent({
      userId,
      value: Math.max(1, Math.ceil((result.usage.totalTokens ?? 1000) / 1000)),
      identifier: runId ?? crypto.randomUUID(),
    });

    await completeServiceRun({
      runId,
      outputPayload: result.output,
    });
    await recordModelInvocation({
      runId,
      result,
      promptVersion: "balbo-data-story-v1",
    });
    await recordUsageLedger({
      userId,
      runId,
      service: "data_story_translator",
      quantity: Math.max(1, Math.ceil((result.usage.totalTokens ?? 1000) / 1000)),
      unit: "k_tokens",
      stripeMeterEventId: meterEvent?.identifier,
    });
    await consumeCredits({ userId });

    return json({
      runId,
      ...result.output,
    });
  } catch (error) {
    await failServiceRun({
      runId,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    return errorJson(error);
  }
}
