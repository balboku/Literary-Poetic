import type { CheckoutPlan } from "./stripe";
import { getSupabaseAdmin } from "./supabase-admin";

const oneTimeCredits: Partial<Record<CheckoutPlan, number>> = {
  data_story_once: 1,
  logic_compass_once: 1,
};

export function creditsForPlan(plan?: string | null) {
  if (!plan) return 0;
  return oneTimeCredits[plan as CheckoutPlan] ?? 0;
}

export async function hasCredits({
  userId,
  amount = 1,
}: {
  userId?: string | null;
  amount?: number;
}) {
  if (process.env.ENFORCE_BILLING !== "true") return true;

  const supabase = getSupabaseAdmin();
  if (!supabase || !userId) return false;

  const { data, error } = await supabase
    .from("credit_wallets")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.balance ?? 0) >= amount;
}

export async function grantCredits({
  userId,
  amount,
}: {
  userId?: string | null;
  amount: number;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !userId || amount <= 0) return;

  const { data, error } = await supabase
    .from("credit_wallets")
    .select("id,balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    const { error: insertError } = await supabase.from("credit_wallets").insert({
      user_id: userId,
      balance: amount,
    });

    if (insertError) throw new Error(insertError.message);
    return;
  }

  const { error: updateError } = await supabase
    .from("credit_wallets")
    .update({
      balance: data.balance + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (updateError) throw new Error(updateError.message);
}

export async function consumeCredits({
  userId,
  amount = 1,
}: {
  userId?: string | null;
  amount?: number;
}) {
  if (process.env.ENFORCE_BILLING !== "true") return;

  const supabase = getSupabaseAdmin();
  if (!supabase || !userId) {
    throw new Error("缺少有效使用者，無法扣除服務額度。");
  }

  const { data, error } = await supabase
    .from("credit_wallets")
    .select("id,balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data || data.balance < amount) {
    throw new Error("服務額度不足，請先完成付款。");
  }

  const { error: updateError } = await supabase
    .from("credit_wallets")
    .update({
      balance: data.balance - amount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (updateError) throw new Error(updateError.message);
}
