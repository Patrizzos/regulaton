// sentry.edge.config.ts
// Runs on the Edge runtime — specifically covers middleware.ts, since that's
// the one place in this app that runs on Edge rather than Node.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: false,
});
