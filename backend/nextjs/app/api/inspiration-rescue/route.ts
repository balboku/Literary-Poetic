import type { NextRequest } from "next/server";

import { getUserIdFromRequest } from "../../../lib/auth";
import { inspirationRequestSchema } from "../../../lib/ai-schemas";
import { generateInspirationRescue } from "../../../lib/gemini";
import { errorJson, json } from "../../../lib/http";
import {
  completeServiceRun,
  createServiceRun,
  failServiceRun,
  hasActiveInspirationSubscription,
  recordModelInvocation,
  recordUsageLedger,
} from "../../../lib/service-runs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let runId: string | null = null;

  try {
    const userId = await getUserIdFromRequest(req);
    const input = inspirationRequestSchema.parse(await req.json());
    const hasAccess = await hasActiveInspirationSubscription(userId);

    if (!hasAccess) {
      return json(
        {
          error: "SUBSCRIPTION_REQUIRED",
          message: "這個櫃台需要有效訂閱才能使用。",
        },
        402,
      );
    }

    runId = await createServiceRun({
      userId,
      service: "inspiration_rescue",
      billingMode: "subscription",
      inputText: input.topic,
      inputPayload: input,
    });

    const result = await generateInspirationRescue(input);

    await completeServiceRun({
      runId,
      outputPayload: result.output,
    });
    await recordModelInvocation({
      runId,
      result,
      promptVersion: "balbo-inspiration-v1",
    });
    await recordUsageLedger({
      userId,
      runId,
      service: "inspiration_rescue",
      quantity: 1,
      unit: "request",
    });

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
