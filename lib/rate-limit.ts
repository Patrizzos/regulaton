// lib/rate-limit.ts
// IP-based rate limiting via Upstash Redis (HTTP-based, works in Edge
// middleware unlike a normal Redis client). Gracefully disabled if
// UPSTASH_REDIS_REST_URL/TOKEN aren't set, so local dev works without
// provisioning Upstash — it only activates once those env vars exist
// (Upstash has a free tier that comfortably covers this use case).
//
// Scoped narrowly to the one concrete vector this was built for: someone
// spamming the magic-link email sign-in endpoint to either email-bomb a
// victim's inbox or run up your Resend bill. IP-based limiting doesn't stop
// a determined attacker rotating IPs, but that's a materially higher-effort
// attack than the baseline nuisance spam this defends against — a reasonable
// tradeoff for where the product is at, not a claim of being unbeatable.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash
  ? new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// 5 sign-in attempts per 10 minutes per IP. Generous enough that a real
// person retrying a typo'd email won't get blocked, tight enough to make
// bulk-spamming an inbox impractical.
const emailSigninLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      prefix:  "ratelimit:email-signin",
    })
  : null;

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

// Returns true if the request should be BLOCKED. Always returns false (i.e.
// allow) if Upstash isn't configured — this fails open by design, since the
// alternative (failing closed) would mean a missing env var takes down
// sign-in entirely, which is a worse outcome than temporarily having no
// rate limiting.
export async function isEmailSigninRateLimited(req: Request): Promise<boolean> {
  if (!emailSigninLimiter) return false;
  const ip = getClientIp(req);
  const { success } = await emailSigninLimiter.limit(ip);
  return !success;
}
