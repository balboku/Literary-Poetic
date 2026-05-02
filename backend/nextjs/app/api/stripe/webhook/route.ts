import Stripe from "stripe";
import type { NextRequest } from "next/server";

import { creditsForPlan, grantCredits } from "../../../../lib/credits";
import { requireEnv } from "../../../../lib/env";
import { json } from "../../../../lib/http";
import { getStripe } from "../../../../lib/stripe";
import { upsertStripeCustomerForUser } from "../../../../lib/service-runs";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return json({ error: "Missing Stripe signature." }, 400);
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      await req.text(),
      signature,
      requireEnv("STRIPE_WEBHOOK_SECRET"),
    );
  } catch (error) {
    return json(
      {
        error: "Invalid webhook signature.",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      400,
    );
  }

  await persistPaymentEvent(event);

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await upsertSubscription(event.data.object as Stripe.Subscription);
      break;
    case "invoice.paid":
    case "invoice.payment_failed":
      await persistInvoiceSignal(event);
      break;
    default:
      break;
  }

  return json({ received: true });
}

async function persistPaymentEvent(event: Stripe.Event) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  await supabase.from("payment_events").upsert(
    {
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event,
      processed_at: new Date().toISOString(),
    },
    {
      onConflict: "stripe_event_id",
    },
  );
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId || session.client_reference_id;
  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;

  await upsertStripeCustomerForUser({
    userId,
    stripeCustomerId: customerId,
  });

  if (!session.subscription) {
    await grantCredits({
      userId,
      amount: creditsForPlan(session.metadata?.plan),
    });
    return;
  }

  const subscription = await getStripe().subscriptions.retrieve(
    String(session.subscription),
  );

  await upsertSubscription(subscription, session.client_reference_id);
}

async function upsertSubscription(
  subscription: Stripe.Subscription,
  fallbackUserId?: string | null,
) {
  const supabase = getSupabaseAdmin();
  const userId = subscription.metadata.userId || fallbackUserId;
  const primaryItem = subscription.items.data[0];

  if (!supabase || !userId) return;

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: String(subscription.customer),
      stripe_subscription_id: subscription.id,
      plan_code: subscription.metadata.plan || "inspiration_monthly",
      status: subscription.status,
      current_period_start: fromUnix(primaryItem?.current_period_start),
      current_period_end: fromUnix(primaryItem?.current_period_end),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "stripe_subscription_id",
    },
  );

  if (error) throw new Error(error.message);
}

async function persistInvoiceSignal(event: Stripe.Event) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  await supabase.from("payment_events").upsert(
    {
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event,
      processed_at: new Date().toISOString(),
    },
    {
      onConflict: "stripe_event_id",
    },
  );
}

function fromUnix(value?: number | null) {
  return value ? new Date(value * 1000).toISOString() : null;
}
