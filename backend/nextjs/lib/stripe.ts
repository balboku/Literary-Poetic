import Stripe from "stripe";

import { appUrl, optionalEnv, requireEnv } from "./env";
import { getStripeCustomerIdForUser } from "./service-runs";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(requireEnv("STRIPE_SECRET_KEY"));
  }

  return stripeClient;
}

export type CheckoutPlan =
  | "inspiration_monthly"
  | "data_story_once"
  | "logic_compass_once";

export async function createCheckoutSession({
  userId,
  plan,
  customerEmail,
}: {
  userId?: string | null;
  plan: CheckoutPlan;
  customerEmail?: string;
}) {
  const stripe = getStripe();
  const priceId = getPriceId(plan);
  const existingCustomerId = await getStripeCustomerIdForUser(userId);
  const mode = plan === "inspiration_monthly" ? "subscription" : "payment";

  const session = await stripe.checkout.sessions.create({
    mode,
    customer: existingCustomerId ?? undefined,
    customer_email: existingCustomerId ? undefined : customerEmail,
    client_reference_id: userId ?? undefined,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId: userId ?? "",
      plan,
    },
    subscription_data:
      mode === "subscription"
        ? ({
            metadata: {
              userId: userId ?? "",
              plan,
            },
            billing_mode: {
              type: "flexible",
            },
          })
        : undefined,
    payment_intent_data:
      mode === "payment"
        ? {
            metadata: {
              userId: userId ?? "",
              plan,
            },
          }
        : undefined,
    success_url: appUrl("/billing/success?session_id={CHECKOUT_SESSION_ID}"),
    cancel_url: appUrl("/billing/cancel"),
  });

  return session;
}

export async function createBillingPortalSession({
  userId,
}: {
  userId?: string | null;
}) {
  const customerId = await getStripeCustomerIdForUser(userId);

  if (!customerId) {
    throw new Error("找不到 Stripe customer，請先完成訂閱或付款。");
  }

  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: appUrl("/account/billing"),
  });
}

export async function sendStripeMeterEvent({
  userId,
  value,
  identifier,
}: {
  userId?: string | null;
  value: number;
  identifier: string;
}) {
  const eventName = optionalEnv("STRIPE_METER_EVENT_NAME_AI_CREDITS");
  const customerId = await getStripeCustomerIdForUser(userId);

  if (!eventName || !customerId) {
    return null;
  }

  return getStripe().billing.meterEvents.create({
    event_name: eventName,
    identifier,
    payload: {
      value: String(value),
      stripe_customer_id: customerId,
    },
  });
}

function getPriceId(plan: CheckoutPlan) {
  const envMap: Record<CheckoutPlan, string> = {
    inspiration_monthly: "STRIPE_INSPIRATION_PRICE_ID",
    data_story_once: "STRIPE_DATA_STORY_PRICE_ID",
    logic_compass_once: "STRIPE_LOGIC_COMPASS_PRICE_ID",
  };

  return requireEnv(envMap[plan]);
}
