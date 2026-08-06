// lib/plans.ts
// Plan metadata — pricing, labels, seat bands. Pure data, safe to import from
// both server and client code. Keep the Stripe SDK client (which needs
// STRIPE_SECRET_KEY) out of this file so client components can import plan
// info without pulling a server-only secret into the browser bundle.

export const PLANS = {
  SOLO: {
    label:       "Small",
    price:       "€25/mo",
    priceIdEnv:  "STRIPE_PRICE_SOLO_MONTHLY",
    employees:   "Up to 10 employees",
    description: "For solo founders and micro teams",
    maxSeats:    10,
    nextPlan:    "SMB" as const,
  },
  SMB: {
    label:       "Medium",
    price:       "€75/mo",
    priceIdEnv:  "STRIPE_PRICE_SMB_MONTHLY",
    employees:   "Up to 50 employees",
    description: "For growing small businesses",
    maxSeats:    50,
    nextPlan:    "BUSINESS" as const,
  },
  BUSINESS: {
    label:       "Business",
    price:       "€195/mo",
    priceIdEnv:  "STRIPE_PRICE_BUSINESS_MONTHLY",
    employees:   "Up to 249 employees",
    description: "For medium-sized organisations",
    maxSeats:    249,
    nextPlan:    null,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
