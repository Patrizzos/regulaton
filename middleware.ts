// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isEmailSigninRateLimited } from "@/lib/rate-limit";

const PUBLIC_PATHS = [
  "/", "/login", "/pricing", "/privacy", "/terms", "/check",
];

// ─── Content-Security-Policy ────────────────────────────────────────────────
//
// script-src uses a per-request nonce + 'strict-dynamic': Next.js detects the
// nonce in this header and automatically applies it to its own framework
// scripts (hydration, RSC payload) — no changes needed elsewhere for that to
// work, this header is the entire mechanism. 'strict-dynamic' lets those
// nonce'd scripts load their own chunk scripts without each one needing an
// individual nonce, which is how Next.js's code-splitting actually works.
//
// style-src keeps 'unsafe-inline' deliberately: every component in this app
// uses React's style={{...}} prop, which server-renders as a literal
// style="..." HTML attribute on first load — CSP's style-src governs that
// attribute, and removing 'unsafe-inline' would break the entire app's visual
// rendering, not just a few components. This is a known, common, accepted
// tradeoff: script injection (XSS) is the primary CSP concern, not style
// injection, and locking down script-src tightly while leaving style-src open
// still meaningfully reduces the app's actual attack surface.
//
// img-src allows avatars.githubusercontent.com specifically for GitHub OAuth
// profile photos (rendered directly via <img src=...> in TeamSection.tsx).
//
// No external fonts (next/font/google self-hosts Inter at build time), no
// external scripts, no iframes, no third-party fetch() targets — verified by
// reading globals.css and every component render path before writing this.
function buildCsp(nonce: string): string {
  // Next.js dev mode requires 'unsafe-eval' for HMR and source maps.
  // Never included in production — Next.js compiles everything away and
  // never calls eval() in the built output.
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://avatars.githubusercontent.com",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function withCsp(response: NextResponse, nonce: string): NextResponse {
  response.headers.set("Content-Security-Policy", buildCsp(nonce));
  response.headers.set("x-nonce", nonce);
  return response;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Nonce generated once per request, threaded through both the request
  // (so Next.js's renderer can read it and embed it in script tags) and the
  // response (so the browser actually enforces the policy against it).
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", buildCsp(nonce));

  const nextWithNonce = () =>
    withCsp(NextResponse.next({ request: { headers: requestHeaders } }), nonce);

  // Rate limit the magic-link email sign-in specifically — the concrete
  // spam/email-bomb vector this was built for. No-ops (allows) if Upstash
  // isn't configured, see lib/rate-limit.ts.
  if (pathname === "/api/auth/signin/email" && req.method === "POST") {
    if (await isEmailSigninRateLimited(req)) {
      return withCsp(
        NextResponse.json(
          { error: "Too many sign-in attempts. Please wait a few minutes and try again." },
          { status: 429 }
        ),
        nonce
      );
    }
  }

  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/stripe/webhook") ||
    // Every route under /api/admin bypasses session auth entirely and relies
    // solely on its own shared-secret check (see app/api/admin/alerts/broadcast).
    // Any new route added under this path MUST implement its own auth check —
    // there is no session/org protection here at all.
    pathname.startsWith("/api/admin") ||
    // Demo endpoint must be public — the whole point is unauthenticated visitors
    // clicking "Try demo" from the marketing page. Without this, the middleware
    // redirects them to /login before the route can create their session.
    pathname === "/api/demo/create" ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/llms.txt" ||
    pathname === "/icon.png" ||
    pathname === "/apple-icon.png" ||
    pathname === "/opengraph-image.png" ||
    pathname === "/twitter-image.png"
  ) {
    return nextWithNonce();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return withCsp(NextResponse.redirect(loginUrl), nonce);
  }

  if (
    !token.hasOrg &&
    !pathname.startsWith("/onboarding") &&
    !pathname.startsWith("/api/")
  ) {
    return withCsp(NextResponse.redirect(new URL("/onboarding", req.url)), nonce);
  }

  return nextWithNonce();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)" ],
};
