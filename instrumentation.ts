// instrumentation.ts
// Required by Next.js 14 (experimental.instrumentationHook in next.config.js
// must be true) to actually invoke this file — without that flag, this
// register() function silently never runs, and Sentry never initializes on
// the server/edge runtimes.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
