// sentry.server.config.ts
// Runs on the Node.js server runtime (API routes, server components).

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: false,

  // Scrub anything that could contain secrets or personal data before it
  // ever leaves the server — request headers can carry the admin broadcast
  // secret, session cookies, or auth tokens, and none of that belongs in an
  // error-tracking dashboard.
  beforeSend(event) {
    if (event.request?.headers) {
      const headers = event.request.headers as Record<string, string>;
      delete headers["x-admin-secret"];
      delete headers["cookie"];
      delete headers["authorization"];
    }
    return event;
  },
});
