# Regulaton

**EU AI Act compliance tooling for SMBs.**

Regulaton helps European small businesses meet their EU AI Act obligations — documenting their AI tool usage, generating the required compliance documents, tracking staff training, and monitoring their compliance posture over time.

> **Status:** Archived — not actively developed. Built as a real product; shelved rather than launched. Sharing as a portfolio project.

---

## What it does

The EU AI Act's Article 4 (AI literacy obligations) came into force in February 2025. Most SMBs that use AI tools are now technically obligated to document their usage and demonstrate staff awareness — but the compliance tooling market targets enterprises, not a 15-person company using ChatGPT and Notion AI.

Regulaton was built to close that gap: a structured onboarding flow that takes a business from zero to a full compliance document set in under 10 minutes, with ongoing monitoring to keep those documents current as their tool inventory and the regulatory landscape evolves.

### Core features

**AI tool inventory**
- Pre-classified library of 40+ common AI tools (ChatGPT, GitHub Copilot, Midjourney, etc.) with default risk levels and compliance notes
- Custom tool entry for anything not in the library
- Per-tool metadata: risk level, data types processed, accountable person, oversight procedure, vendor compliance status
- Automatic `NEEDS_UPDATE` flagging when inventory changes after documents are finalised

**Compliance document generation**
Five document types, generated as `.docx` (via the `docx` package) and `.pdf` (via `pdf-lib`), pre-populated from the org's tool inventory and profile:

| Document | Article | Status |
|---|---|---|
| Acceptable Use Policy | Art. 4 | In force Feb 2025 |
| AI System Register | Arts. 6–7 | In force Aug 2026 |
| Staff Training Records | Art. 4 | In force Feb 2025 |
| Human Oversight Procedure | Art. 14 | Deadline Dec 2027 |
| Fundamental Rights Assessment | Art. 27 | Deadline Dec 2027 |

**Compliance score engine**
A weighted score (0–100) across five obligations, recalculated on every relevant mutation and persisted to the DB. Each obligation returns a `Status` (`COMPLIANT` / `PARTIAL` / `NON_COMPLIANT` / `NOT_APPLICABLE`), a numeric score, a human-readable message, and a suggested action with a URL. The score drives the dashboard and surfaces the highest-priority action to take next.

**Stale document detection**
When an org's tool inventory or profile changes after a document has been finalised, that document is automatically marked `NEEDS_UPDATE` with a typed `StaleReason` (`TOOLS_CHANGED` | `ORG_CHANGED`) so the UI can explain specifically what changed, not just "this document is out of date."

**Staff training records**
Log and track EU AI Act literacy training completions per staff member. Training records feed directly into the Article 4 compliance score and the generated Training Records document.

**Penalty exposure calculator**
Article 99 fine estimator. Inputs: annual global turnover, SME status, violation tier. Correctly applies the SME rule (lower of fixed cap vs. % of turnover) vs. the standard rule (higher of the two). Three tiers: prohibited practices (€35M / 7%), most other breaches (€15M / 3%), incorrect information to authorities (€7.5M / 1%).

**Alert system**
Six alert types (`REVIEW_DUE`, `REGULATION_UPDATE`, `DOCUMENT_NEEDS_UPDATE`, `TOOL_NEEDS_REVIEW`, `TRAINING_REMINDER`, `COMPLIANCE_RISK`), broadcast via an admin endpoint and surfaced in-app.

**Subscriptions**
Three Stripe-billed tiers, segmented by employee count:

| Plan | Price | Seats |
|---|---|---|
| Small | €25/mo | ≤ 10 employees |
| Medium | €75/mo | ≤ 50 employees |
| Business | €195/mo | ≤ 249 employees |

14-day free trial, no credit card required at signup.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | RSC for server-rendered dashboard views; edge middleware for auth without a DB round-trip |
| Language | TypeScript | End-to-end type safety; Prisma's generated client makes DB queries fully typed |
| Styling | Tailwind CSS + inline `style` props | Tailwind for layout utilities; inline styles for the design token system (CSS vars for dark/light theming) |
| Database | PostgreSQL via Neon | Serverless Postgres with connection pooling — the `directUrl` / `url` split in the Prisma schema handles the pooler vs. direct connection distinction for migrations |
| ORM | Prisma 5 | Schema-as-source-of-truth; generated enums kept in sync across DB, API, and client without a manual mapping layer |
| Auth | NextAuth v4 | GitHub OAuth + magic-link email. The `hasOrg` claim is baked into the JWT so middleware can gate the dashboard without touching the DB |
| Payments | Stripe | Subscription billing with checkout, webhook handling, and plan enforcement |
| Email | Resend | Transactional email (magic links, notifications) |
| Rate limiting | Upstash Redis | Edge-compatible rate limiting on the magic-link sign-in endpoint specifically |
| Error tracking | Sentry | Client, server, and edge configs; the `instrumentation.ts` hook initialises the server-side SDK at startup |
| Document generation | `docx` + `pdf-lib` | `.docx` for editable Word output; `pdf-lib` for sealed PDF copies |

---

## Architecture notes

### Edge middleware auth
`middleware.ts` runs on Vercel's Edge Network. Auth is a `getToken()` call that reads the NextAuth JWT from the cookie — no database hit, no cold start latency on the auth check. The `hasOrg` claim in the token means the middleware can redirect unauthenticated users to `/login` and org-less users to `/onboarding` without any async data fetching.

### Per-request Content Security Policy
Each request gets a fresh `crypto.randomUUID()` nonce, base64-encoded and threaded through both the request headers (so Next.js's RSC renderer picks it up and applies it to framework scripts) and the response headers (so the browser enforces the policy). `script-src` uses `nonce-{n} 'strict-dynamic'` — the nonce covers Next.js's entry scripts; `strict-dynamic` lets those scripts load their own code-split chunks without each one needing an individual nonce. `style-src` keeps `unsafe-inline` deliberately: the entire app uses React's `style={{}}` prop, which renders as `style="..."` HTML attributes on first load, and CSP's `style-src` governs those attributes.

### Stripe webhook idempotency
Stripe documents at-least-once webhook delivery — the same event can be redelivered after a slow response. The `ProcessedWebhookEvent` table stores Stripe's own `event.id` as the primary key. The handler does a `create()` on that ID before processing; a duplicate delivery hits the unique constraint and short-circuits rather than reprocessing the event.

### Compliance score architecture
`lib/compliance/scorer.ts` is a pure function: `(org, tools, documents, trainingRecords) => ComplianceResult`. It has no side effects and no DB access — it's called from API routes after the data is fetched, and the result is written back to `ComplianceScore`. This makes it trivially testable in isolation and easy to run in CI against fixture data.

Each of the five obligation scorers follows the same pattern: check for the worst state first, return early with a score + message + action, and only reach `COMPLIANT` after every condition is satisfied. The overall score is an equal-weighted average (20% per obligation).

### Soft-delete with cron purge
Account deletion sets `deletionScheduledAt` on the `Organization` row rather than immediately cascading. A daily cron purges rows older than 30 days. This gives a recovery window without requiring a separate "recovery" UI or a backup restore — the data is live in the DB, and unsetting the field is enough to undo it.

### `_disabled` directory
Features that were pulled from the current release but kept for reference live under `app/_disabled/`. Next.js's file-based router ignores directories prefixed with `_`, so these routes are dead without being deleted. Cleaner than a branch; easier to recover than a revert.

### Document stale detection
When a tool is added, removed, or edited, or when org details change, the affected documents are transitioned to `NEEDS_UPDATE` with a `StaleReason` set. The reason is a typed enum rather than a string so the UI can render specific messages ("Your tool inventory changed" vs. "Your organisation details changed") without a string match.

---

## Regulatory context

The EU AI Act applies to any organisation using or providing AI systems within the EU. Key deadlines:

- **February 2025** — Article 4 (AI literacy) and Article 5 (prohibited practices) in force
- **August 2026** — Article 50 (transparency: chatbots must disclose they're AI) in force
- **December 2026** — Article 50 media labelling (AI-generated content) for existing systems
- **December 2027** — Annex III (high-risk AI system obligations) — extended from the original August 2026 deadline

Regulaton targets the Article 4 and Article 5–adjacent obligations that apply to *deployers* (businesses using third-party AI tools), not providers (companies building AI systems). This is where the SMB market sits.

---

## Local development

**Prerequisites:** Node.js 20+, a PostgreSQL database (or a free [Neon](https://neon.tech) project), a Stripe account (test mode is fine).

```bash
git clone https://github.com/your-handle/regulaton
cd regulaton
npm install
```

Copy `.env.local.example` to `.env.local` and fill in your values (see below).

```bash
# Push the schema to your database
npm run db:push

# Seed the AI tool library (40+ pre-classified tools)
npm run db:seed

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For Stripe webhook testing locally:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Environment variables

```env
# Database (Neon: use the pooled URL for DATABASE_URL, direct URL for DIRECT_URL)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=        # node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth
GITHUB_ID=
GITHUB_SECRET=

# Resend
RESEND_API_KEY=
EMAIL_FROM=Regulaton <hello@yourdomain.com>

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_SOLO_MONTHLY=
STRIPE_PRICE_SMB_MONTHLY=
STRIPE_PRICE_BUSINESS_MONTHLY=

# Upstash (optional — rate limiting degrades gracefully if not set)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

See `DEPLOY.md` for the full production deployment guide (Vercel + Neon + Stripe + Resend).

---

## Why I stopped

A few honest reasons:

**The market timing was awkward.** Article 4 came into force in February 2025, but enforcement is still soft and awareness among SMBs is low. Selling compliance tooling works best when people feel the pressure — the window between "this is about to matter" and "this already hurt someone I know" is the prime selling period, and I wasn't confident I was in it.

**The document generation ceiling.** The `.docx` output is solid for a first version, but the real value in a compliance tool is keeping documents current with regulatory changes, not just generating them once. That requires either a legal content team to maintain template accuracy or a licensing arrangement with a legal publisher — neither of which I had the resources to stand up alone.

**Distribution.** This needs to land in the inbox of an operations manager or COO at a 20-person EU company. That's a specific person, in a specific channel, and I didn't have a clear path to them at volume. Additionally, as a US-based company doing business with EU citizen data, I would be required to own or work with a brick-and-mortar institution within the EU as well as having to follow other EU-specific compliance guidelines.

**What I'd do differently:** Start with a narrower wedge — one country, one industry vertical — rather than targeting "EU SMBs" as a monolith. A law firm add-on, an HR software integration, or a sector-specific product (fintech, healthcare) would have a more natural distribution path and a more concrete compliance need than the broad horizontal play. Either that or simply stick to US-based compliance and governance.

---

## What I'm proud of

- The compliance scorer is genuinely well-reasoned. The five-obligation model maps accurately to the legal structure of the Act, the SME-specific rules (soft start date, lower fine caps, scaled-down requirements) are handled correctly, and the scoring logic is documented with the regulatory reasoning in the comments, not just the implementation.
- The security defaults are production-grade from day one: per-request CSP nonces, rate-limited auth endpoints, webhook idempotency, edge-native auth with no DB hit on every page load.
- The onboarding-to-compliance-document flow takes under 10 minutes from a cold start. That's the core product promise, and it holds.

---

*Regulaton is compliance tooling, not legal advice. Documents generated are based on publicly available EU AI Act guidance. For high-risk AI systems or complex regulatory questions, consult qualified legal counsel.*
