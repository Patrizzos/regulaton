// lib/subscription.ts
// Helpers for checking subscription access in API routes.

import { prisma } from "./db";

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: string; code: 402 };

export async function checkAccess(orgId: string): Promise<AccessResult> {
  const sub = await prisma.subscription.findUnique({
    where: { organizationId: orgId },
  });

  if (!sub) {
    return { allowed: false, reason: "No subscription found.", code: 402 };
  }

  // Active paid subscription — always allow
  if (sub.status === "ACTIVE") {
    return { allowed: true };
  }

  // Trial still running — allow
  if (sub.status === "TRIALING" && sub.trialEndsAt && sub.trialEndsAt > new Date()) {
    return { allowed: true };
  }

  // Trial expired without subscribing
  if (sub.status === "TRIALING" && (!sub.trialEndsAt || sub.trialEndsAt <= new Date())) {
    return {
      allowed: false,
      reason: "Your free trial has ended. Subscribe to continue.",
      code: 402,
    };
  }

  // Payment failed
  if (sub.status === "PAST_DUE") {
    return {
      allowed: false,
      reason: "Your payment has failed. Update your payment method to restore access.",
      code: 402,
    };
  }

  // Cancelled
  if (sub.status === "CANCELED") {
    return {
      allowed: false,
      reason: "Your subscription has been cancelled. Resubscribe to continue.",
      code: 402,
    };
  }

  return { allowed: true };
}
