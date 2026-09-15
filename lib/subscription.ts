// lib/subscription.ts
// Helpers for checking subscription access in API routes.

import { NextResponse } from "next/server";
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

// Convenience wrapper for API routes that mutate data (add/edit/delete a
// tool, regenerate or finalise a document, log training, etc.). Read-only
// (GET) routes deliberately do NOT call this — someone past their trial or
// with a lapsed subscription can still view everything they already built
// (dashboard, documents, inventory), they just can't create or change
// anything further, or export, without active access. That's a deliberate
// choice, not an oversight: a full lockout on data you can't even look at
// feels punitive for a product whose whole pitch is "your compliance posture
// stays current" — gating writes/exports is enough to create real pressure
// to convert without making the product feel like it's holding data hostage.
//
// Usage:
//   const denied = await requireAccess(session.orgId);
//   if (denied) return denied;
export async function requireAccess(orgId: string): Promise<NextResponse | null> {
  const access = await checkAccess(orgId);
  if (access.allowed) return null;
  return NextResponse.json({ error: access.reason }, { status: access.code });
}
