import type { GeminiResult } from "./gemini";
import { getSupabaseAdmin } from "./supabase-admin";

export type ServiceType =
  | "inspiration_rescue"
  | "data_story_translator"
  | "logic_compass";

type CreateRunInput = {
  userId?: string | null;
  service: ServiceType;
  billingMode: "subscription" | "one_time" | "metered";
  inputText: string;
  inputPayload?: Record<string, unknown>;
  modelName?: string;
};

export async function createServiceRun(input: CreateRunInput) {
  const supabase = getSupabaseAdmin();

  if (!supabase || !input.userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("service_runs")
    .insert({
      user_id: input.userId,
      service: input.service,
      billing_mode: input.billingMode,
      status: "processing",
      input_text: input.inputText,
      input_payload: input.inputPayload ?? {},
      model_provider: "google",
      model_name: input.modelName,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function completeServiceRun({
  runId,
  outputPayload,
}: {
  runId: string | null;
  outputPayload: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase || !runId) return;

  const { error } = await supabase
    .from("service_runs")
    .update({
      status: "completed",
      output_payload: outputPayload,
      completed_at: new Date().toISOString(),
    })
    .eq("id", runId);

  if (error) throw new Error(error.message);
}

export async function failServiceRun({
  runId,
  errorMessage,
}: {
  runId: string | null;
  errorMessage: string;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase || !runId) return;

  await supabase
    .from("service_runs")
    .update({
      status: "failed",
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq("id", runId);
}

export async function recordModelInvocation<T>({
  runId,
  result,
  promptVersion,
}: {
  runId: string | null;
  result: GeminiResult<T>;
  promptVersion: string;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase || !runId) return;

  const { error } = await supabase.from("model_invocations").insert({
    run_id: runId,
    provider: "google",
    model_name: result.modelName,
    prompt_version: promptVersion,
    input_tokens: result.usage.inputTokens,
    output_tokens: result.usage.outputTokens,
    latency_ms: result.latencyMs,
    raw_response: toJson(result.rawResponse),
  });

  if (error) throw new Error(error.message);
}

export async function recordUsageLedger({
  userId,
  runId,
  service,
  quantity,
  unit,
  stripeMeterEventId,
}: {
  userId?: string | null;
  runId: string | null;
  service: ServiceType;
  quantity: number;
  unit: string;
  stripeMeterEventId?: string;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase || !userId) return;

  const { error } = await supabase.from("usage_ledger").insert({
    user_id: userId,
    run_id: runId,
    service,
    quantity,
    unit,
    stripe_meter_event_id: stripeMeterEventId,
  });

  if (error) throw new Error(error.message);
}

export async function getStripeCustomerIdForUser(userId?: string | null) {
  const supabase = getSupabaseAdmin();

  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .not("stripe_customer_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.stripe_customer_id ?? null;
}

export async function upsertStripeCustomerForUser({
  userId,
  stripeCustomerId,
}: {
  userId?: string | null;
  stripeCustomerId?: string | null;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase || !userId || !stripeCustomerId) return;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .not("stripe_customer_id", "is", null)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (data?.id) {
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        stripe_customer_id: stripeCustomerId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    if (updateError) throw new Error(updateError.message);
    return;
  }

  const { error: insertError } = await supabase.from("subscriptions").insert({
    user_id: userId,
    stripe_customer_id: stripeCustomerId,
    plan_code: "customer",
    status: "active",
  });

  if (insertError) throw new Error(insertError.message);
}

export async function hasActiveInspirationSubscription(userId?: string | null) {
  if (process.env.ENFORCE_BILLING !== "true") return true;

  const supabase = getSupabaseAdmin();
  if (!supabase || !userId) return false;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .eq("plan_code", "inspiration_monthly")
    .in("status", ["active", "trialing"])
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data);
}

function toJson(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}
