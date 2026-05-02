import { z } from "zod";
import type { NextRequest } from "next/server";

import { getUserIdFromRequest } from "../../../lib/auth";
import { createCheckoutSession } from "../../../lib/stripe";
import { errorJson, json } from "../../../lib/http";

export const runtime = "nodejs";

const checkoutRequestSchema = z.object({
  plan: z.enum([
    "inspiration_monthly",
    "data_story_once",
    "logic_compass_once",
  ]),
  customerEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const body = checkoutRequestSchema.parse(await req.json());
    const session = await createCheckoutSession({
      userId,
      plan: body.plan,
      customerEmail: body.customerEmail,
    });

    return json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    return errorJson(error);
  }
}
