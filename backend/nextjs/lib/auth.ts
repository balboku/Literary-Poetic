import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "./supabase-admin";

export async function getUserIdFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const demoUserId = req.headers.get("x-demo-user-id");

  if (!authHeader?.startsWith("Bearer ")) {
    return demoUserId;
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return demoUserId;
  }

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    return demoUserId;
  }

  return data.user?.id ?? demoUserId;
}
