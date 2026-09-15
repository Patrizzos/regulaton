const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for instrumentation.ts to actually run on Next.js 14 (stable,
  // no flag needed, on Next 15+) — this is what loads sentry.server.config.ts
  // and sentry.edge.config.ts.
  experimental: {
    instrumentationHook: true,
  },
  async headers() {
    return [
      {
        // Content-Security-Policy is NOT set here — it needs a fresh nonce
        // per request, which next.config.js's static headers() can't provide.
        // It's set in middleware.ts instead, alongside the request-header
        // plumbing Next.js needs to apply that nonce to its own framework
        // scripts. Everything else that can safely be static lives here.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Only takes effect over HTTPS (browsers ignore it on plain HTTP,
          // e.g. localhost), so safe to always send.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

// Wraps the build to upload source maps to Sentry and instrument
// server/edge code automatically. Safe to leave in place even before a real
// Sentry project exists — with SENTRY_DSN unset, the SDK no-ops at runtime;
// silent: true just quiets the wrapper's own build-time console output when
// there's no SENTRY_AUTH_TOKEN configured for source map uploads yet.
module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
