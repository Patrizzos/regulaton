// lib/stripe.ts
// Server-only: instantiates the Stripe SDK with the secret key. Never import
// this file from a client component — use lib/plans.ts for plan data instead.

import Stripe from "stripe";
import { PLANS as PLAN_DATA, PlanKey } from "./plans";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
  typescript: true,
});

export { PLANS } from "./plans";
export type { PlanKey } from "./plans";

export function getPriceId(plan: PlanKey): string {
  const envVar = PLAN_DATA[plan].priceIdEnv;
  const priceId = process.env[envVar];
  if (!priceId) throw new Error(`Missing env var ${envVar} for plan ${plan}`);
  return priceId;
}
