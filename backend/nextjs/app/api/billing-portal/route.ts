import type { NextRequest } from "next/server";

import { getUserIdFromRequest } from "../../../lib/auth";
import { errorJson, json } from "../../../lib/http";
import { createBillingPortalSession } from "../../../lib/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const session = await createBillingPortalSession({ userId });

    return json({
      url: session.url,
    });
  } catch (error) {
    return errorJson(error);
  }
}
