// lib/stripe.ts
// Server-only: instantiates the Stripe SDK with the secret key. Never import
// this file from a client component — use lib/plans.ts for plan data instead.
//
// STRIPE_SECRET_KEY is optional — if unset, stripe is null and any code path
// that calls checkout or the API will no-op rather than crash. This lets the
// app run as a demo without Stripe configured.

import Stripe from "stripe";
import { PLANS as PLAN_DATA, PlanKey } from "./plans";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      typescript: true,
    })
  : null;

export const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;

export { PLANS } from "./plans";
export type { PlanKey } from "./plans";

export function getPriceId(plan: PlanKey): string | null {
  if (!stripeEnabled) return null;
  const envVar  = PLAN_DATA[plan].priceIdEnv;
  const priceId = process.env[envVar];
  if (!priceId) throw new Error(`Missing env var ${envVar} for plan ${plan}`);
  return priceId;
}
