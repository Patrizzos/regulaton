// sentry.client.config.ts
// Runs in the browser. If SENTRY_DSN isn't set (e.g. local dev without a
// Sentry project configured), Sentry.init safely no-ops rather than throwing
// — nothing needs to change here to develop locally without Sentry set up.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Keep this conservative to start — 100% in early low-traffic days is fine
  // cost-wise, but this is the first knob to turn down if volume grows.
  tracesSampleRate: 1.0,

  // Session replay is off by default — it's the single biggest privacy
  // surface Sentry offers (records real user sessions), and this product's
  // whole positioning is about handling compliance data carefully. Turn on
  // deliberately later if you decide you want it, with masking configured
  // for anything showing org/tool/training data — don't default it on.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  debug: false,
});
