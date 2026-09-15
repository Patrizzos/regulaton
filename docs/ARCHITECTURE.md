# Regulaton — Architecture

This document covers the key technical decisions in the codebase: how the system is structured, why specific approaches were chosen, and what the trade-offs were. It's aimed at someone reading the code and wanting to understand the reasoning behind it, not just the mechanics.

---

## Table of Contents

1. [System overview](#1-system-overview)
2. [Request lifecycle and routing](#2-request-lifecycle-and-routing)
3. [Authentication and authorisation](#3-authentication-and-authorisation)
4. [Multi-tenancy model](#4-multi-tenancy-model)
5. [Document generation pipeline](#5-document-generation-pipeline)
6. [Compliance score engine](#6-compliance-score-engine)
7. [Stale document detection](#7-stale-document-detection)
8. [Stripe integration and webhook idempotency](#8-stripe-integration-and-webhook-idempotency)
9. [Security defaults](#9-security-defaults)
10. [Soft delete and data retention](#10-soft-delete-and-data-retention)
11. [Feature flagging via `_disabled`](#11-feature-flagging-via-_disabled)
12. [Data model overview](#12-data-model-overview)
13. [Deployment considerations](#13-deployment-considerations)

---

## 1. System overview

Regulaton is a multi-tenant SaaS built on Next.js 14's App Router. Every user belongs to an `Organization`, and all compliance data is scoped to that organization. The product is broadly three things:

- A **data entry flow** (onboarding + inventory management) where users tell the system which AI tools they use and how
- A **document generation engine** that turns that inventory into five specific EU AI Act compliance documents
- A **compliance monitoring layer** that keeps a scored, up-to-date view of the org's compliance posture and flags when things go stale

The stack is: Next.js (frontend + API), Prisma + PostgreSQL/Neon (persistence), NextAuth (auth), Stripe (subscriptions), Resend (email), Upstash Redis (rate limiting), Sentry (error tracking).

```
Browser
  │
  ├─ GET /dashboard, /documents, /inventory …
  │     └─ Next.js App Router (RSC)
  │           └─ Reads data via Prisma → Neon (Postgres)
  │
  ├─ POST /api/documents/[type]/regenerate …
  │     └─ Next.js Route Handler
  │           └─ generateDocument() → upsert to DB
  │
  └─ POST /api/stripe/webhook
        └─ Signature-verified Stripe event handler
              └─ upsertSubscription() → DB

Edge (Vercel)
  └─ middleware.ts (runs before every request)
        └─ JWT auth check (getToken) — no DB hit
        └─ CSP nonce generation
        └─ Rate limiting on /api/auth/signin/email
```

---

## 2. Request lifecycle and routing

The Next.js App Router directory structure uses route groups to separate concerns without affecting URLs:

```
app/
  (marketing)/        — public pages: homepage, /check, /pricing, /privacy, /terms
  (auth)/             — /login, /onboarding
  (dashboard)/        — /dashboard, /documents, /inventory, /training, /learn, /penalty-calculator, /settings
  api/                — Route Handlers (API endpoints)
  _disabled/          — dead routes, ignored by the router (see §11)
```

Every request hits `middleware.ts` first. The middleware does three things in order:

1. **Generate a CSP nonce** for the request (see §9)
2. **Rate-limit magic-link sign-in** (`POST /api/auth/signin/email`) via Upstash
3. **Auth-gate non-public routes** via JWT check

The auth check uses `getToken()` from `next-auth/jwt`, which reads the session JWT from the cookie without touching the database. The JWT carries `orgId`, `orgRole`, and `hasOrg` claims (populated on sign-in, see §3), so the middleware can make two routing decisions — authenticated vs. not, and has-org vs. not — without any DB latency on every page load.

---

## 3. Authentication and authorisation

### Providers

NextAuth v4 with two providers:

- **GitHub OAuth** — primary sign-in for developers/technical users
- **Email (magic link)** — via Resend SMTP, for non-technical users who don't have GitHub accounts

Both use the `PrismaAdapter` so user, session, account, and verification token records are written directly to the application database.

### JWT strategy and the `hasOrg` claim

Sessions use `strategy: "jwt"` rather than the database session strategy. This means the session is a signed JWT in a cookie — not a row in the `Session` table on every request. The implication: session data is read from the cookie, not from a DB query, on every request.

The JWT callback populates three custom claims on first sign-in:

```typescript
// Runs on every token refresh; the DB query only fires when orgId isn't yet cached
const membership = await prisma.organizationMember.findFirst({
  where: { userId: uid },
});
token.orgId   = membership?.organizationId ?? null;
token.orgRole = membership?.role ?? null;
token.hasOrg  = !!membership;
```

After onboarding completes (when the org is created and the user is added as a member), the token is refreshed and the new claims propagate. This is why onboarding calls `signIn()` rather than just a session update — it forces a token refresh.

### Why not database sessions?

The standard advice is "use database sessions if you need to invalidate them." For Regulaton, the main invalidation case is account deletion — the org is soft-deleted (see §10), and there's a 30-day window before anything is actually purged. An invalid JWT for a soft-deleted org landing on a protected route hits the middleware's `getToken()` check, gets through (the token is still valid), and then hits the DB where the org lookup returns a scheduled-for-deletion row, which the application handles. This was considered an acceptable trade-off at the product's stage versus the DB query cost of database sessions on every request.

### Authorisation pattern in route handlers

Every protected route handler follows the same three-step pattern:

```typescript
// 1. Verify there's a session with an org
const session = await getServerSession(authOptions);
if (!session?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// 2. Verify the subscription allows this action
const denied = await requireAccess(session.orgId);
if (denied) return denied;

// 3. All DB queries are scoped by the session's orgId — never trust a client-supplied orgId
const data = await prisma.someModel.findMany({
  where: { organizationId: session.orgId },
});
```

The `orgId` for every DB query always comes from the verified session, never from the request body or query string. This prevents any cross-tenant data access regardless of what a client sends.

---

## 4. Multi-tenancy model

The tenancy unit is `Organization`. Every piece of compliance data — tools, documents, training records, the compliance score, alerts, and the subscription — hangs off the org via a foreign key, and Prisma's cascading deletes ensure a deleted org cleans up everything under it.

```
Organization
  ├── OrganizationMember[]    (currently max 1: always OWNER)
  ├── OrganizationAITool[]    (the inventory)
  ├── ComplianceDocument[]    (generated documents)
  ├── TrainingRecord[]        (staff training log)
  ├── ComplianceScore         (1:1, recalculated on mutations)
  ├── Subscription            (1:1, Stripe-backed)
  └── Alert[]                 (in-app notifications)
```

### Single-member orgs (intentional)

`OrganizationMember` has a `MemberRole` enum with only one value (`OWNER`) and a unique constraint on `[userId, organizationId]`. The schema comment explains the rationale: the product was designed for a single-login-per-organisation model (one compliance lead per company), the invite-link feature was disabled before launch, and the enum is kept rather than replaced with a boolean so a future multi-user feature has a natural place to add roles without a schema migration that breaks existing data.

### Subscription enforcement

`requireAccess()` in `lib/subscription.ts` checks the org's `Subscription` row. A trial that hasn't expired, or an active subscription, passes through. An expired trial or cancelled subscription returns a `402` response. This is called at the start of every mutating route handler (document generation, tool CRUD, training records), but read-only dashboard views still render with degraded state rather than hard-gating — a deliberate product decision to avoid locking a user out of their own data when a payment fails.

---

## 5. Document generation pipeline

This is the core technical feature of the product. The pipeline has three distinct stages: **generation**, **storage**, and **rendering/export**.

### Stage 1: Generation (`lib/compliance/generator.ts`)

The generator is a set of pure functions — one per document type — that take org data and return a `GeneratedDocument`:

```typescript
export interface GeneratedDocument {
  type: DocumentType;
  title: string;
  subtitle: string;
  organizationName: string;
  generatedAt: string;
  blocks: Block[];
}
```

The `Block` type is a renderer-agnostic intermediate representation:

```typescript
type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][]; columnWidths?: number[] }
  | { type: "divider" }
  | { type: "signature"; label: string; date: string }
  | { type: "note"; text: string };
```

The generator has no side effects and no DB access. It receives already-fetched data and returns the structured document. This means: easy to test in isolation, easy to call from multiple contexts (API routes, scripts, tests), and the output format isn't coupled to any specific renderer.

### Stage 2: Storage

The generated document is stored as JSON in `ComplianceDocument.content` (a `Json` column in Postgres). The document is not stored as HTML or as a `.docx` binary — it's stored as the structured block representation. This is a deliberate choice:

- The DB stores the *content*, not a rendering of it
- The browser preview, the `.docx` export, and the `.pdf` export all render from the same stored JSON independently
- If the rendering logic changes (e.g. a new heading style), previously stored documents don't need to be regenerated — only the renderer needs updating

Documents are upserted via `organizationId_type` as the unique key, meaning each org has at most one document of each type. On regeneration, the content is replaced, the status is reset to `DRAFT`, the `staleReason` is cleared, and the `version` is incremented.

### Stage 3: Rendering and export

**Browser preview:** A React component reads the stored JSON and renders blocks to HTML — headings become `<h2>`, tables become `<table>`, etc.

**`.docx` export** (`/api/documents/[type]/export`): The stored JSON blocks are fed to the `docx` npm package. Tables use the `columnWidths` hint stored on the block (set by the generator for tables it knows are wide) to distribute column widths appropriately for printed A4.

**`.pdf` export** (`/api/documents/[type]/export-pdf`): The same blocks are fed to `pdf-lib`. The PDF is generated server-side and returned as a binary response.

### Why store JSON rather than the final format?

Alternative considered: generate and store a `.docx` binary. Rejected because: re-rendering from structured data is straightforward and cheap; the `.docx` binary would need to be regenerated just to preview the document in the browser; and the JSON representation is what makes the "document is stale" detection (§7) tractable — you can inspect the content, compare it to current org state, and understand what changed.

---

## 6. Compliance score engine

`lib/compliance/scorer.ts` is a pure function:

```typescript
export function calculateComplianceScore(
  org: Organization,
  tools: OrganizationAITool[],
  documents: ComplianceDocument[],
  trainingRecords: TrainingRecord[]
): ComplianceResult
```

It takes all the data already fetched and returns a `ComplianceResult` with five `ObligationResult` objects and an `overallScore`. No DB access, no side effects.

### The five obligations

| Obligation | Weight | Key logic |
|---|---|---|
| Article 4 Literacy | 20% | AUP exists and is finalised + training records exist + AUP < 12 months old |
| Acceptable Use Policy | 20% | AUP status (DRAFT / FINALIZED / NEEDS_UPDATE) + age |
| AI System Register | 20% | Tools in inventory + register generated + tool profiles complete + register finalised |
| Human Oversight | 20% | N/A if no HIGH risk tools; else all high-risk tools have oversight procedures + document finalised |
| Vendor Due Diligence | 20% | All active tools have `vendorCompliance` set (even if `false` — not-checked is worse than checked-and-non-compliant) |

### Obligation result structure

Each obligation scorer returns:

```typescript
interface ObligationResult {
  status: Status;           // COMPLIANT | PARTIAL | NON_COMPLIANT | NOT_APPLICABLE
  score: number;            // 0–100
  message: string;          // human-readable current state
  actionLabel?: string;     // e.g. "Generate AUP"
  actionUrl?: string;       // e.g. "/documents/acceptable-use-policy"
}
```

The `actionLabel` and `actionUrl` are used by the dashboard to surface the single most important next action for each obligation. The scorer doesn't just say what's wrong — it tells the user exactly what to do next and links them to the right page.

### Scoring pattern: worst-state-first

Every obligation scorer is structured as a chain of early returns, checking the worst state first:

```typescript
function scoreArticle4Literacy(documents, trainingRecords): ObligationResult {
  if (!aup)                           return { status: NON_COMPLIANT, score: 0, ... };
  if (aup.status === DRAFT)           return { status: PARTIAL,       score: 30, ... };
  if (aup.status === FINALIZED
      && !hasTrainingRecords)         return { status: PARTIAL,       score: 60, ... };
  if (aup is over 12 months old)     return { status: PARTIAL,       score: 70, ... };
  if (aup.status === FINALIZED
      && hasTrainingRecords)          return { status: COMPLIANT,     score: 100, ... };
}
```

This makes the logic easy to read — the terminal `COMPLIANT` case can only be reached if every condition above it was satisfied — and easy to extend. Adding a new requirement (e.g. "AUP must be reviewed by a second person") is an additional check in the chain, not a restructuring of the whole function.

### Overall score

A simple equal-weighted average: `(a4 + aup + register + oversight + vendor) / 5`. The Human Oversight obligation returns `score: 100` when status is `NOT_APPLICABLE` (no high-risk tools), so it doesn't penalise orgs that don't have high-risk AI — it contributes its full 20% automatically.

### Where the score is persisted

The `ComplianceScore` table holds the latest calculated result. It's recalculated and written back to the DB after every mutation that could affect it: tool add/edit/delete, document generate/finalise, training record add/delete, org profile update. The recalculation is a call to `calculateComplianceScore()` followed by a `complianceScore.upsert()` — it runs in the same request as the mutation, not as a background job. This keeps the score consistent without needing a queue or a cron, at the cost of a slightly heavier write path.

---

## 7. Stale document detection

When org data changes after a document has been generated, that document needs to be regenerated. The naive approach is a UI note saying "you may want to regenerate your documents." Regulaton does something more specific: it automatically marks affected documents as `NEEDS_UPDATE` with a typed reason.

### The `StaleReason` enum

```prisma
enum StaleReason {
  TOOLS_CHANGED
  ORG_CHANGED
}
```

`ComplianceDocument` has a nullable `staleReason` field. When a document's status is set to `NEEDS_UPDATE`, the reason is set alongside it. The UI uses this to show a specific message:

- `TOOLS_CHANGED` → "Your AI tool inventory changed since this document was generated."
- `ORG_CHANGED` → "Your organisation details changed since this document was generated."

This is a small detail but it matters for UX: "this document is out of date" is less useful than knowing exactly what changed.

### Where the staleness is triggered

In the API routes that mutate relevant data:

- `POST /api/tools` (add tool) → marks AUP and AI System Register as `NEEDS_UPDATE` with `TOOLS_CHANGED`
- `DELETE /api/tools/[id]` → same
- `PATCH /api/tools/[id]` → same (on any substantive field change)
- `PATCH /api/org` → marks all documents as `NEEDS_UPDATE` with `ORG_CHANGED`

The staleness marking is done in the same transaction as the mutation where possible, so there's no window where the data is changed but the documents aren't yet flagged.

---

## 8. Stripe integration and webhook idempotency

### Subscription state machine

The `Subscription` model maps directly to Stripe's subscription lifecycle. Stripe is the source of truth; the DB row is a local cache of the current state, kept in sync via webhooks. Four events are handled:

| Stripe event | Handler action |
|---|---|
| `checkout.session.completed` | Retrieve the subscription from Stripe; upsert the local `Subscription` row |
| `customer.subscription.updated` | Upsert with new status, plan, and period end |
| `customer.subscription.deleted` | Upsert with `CANCELED` status |
| `invoice.payment_failed` | Update status to `PAST_DUE`; create a `COMPLIANCE_RISK` alert for the org |

### Webhook idempotency

Stripe documents at-least-once delivery — the same event can arrive more than once (e.g. if the endpoint is slow to respond). Without idempotency handling, `invoice.payment_failed` could create two "payment failed" alerts for the same payment failure, and `checkout.session.completed` could attempt to create a subscription row twice.

The solution is a `ProcessedWebhookEvent` table with `id` (Stripe's `event.id`) as the primary key:

```typescript
// Before processing any event:
try {
  await prisma.processedWebhookEvent.create({
    data: { id: event.id, type: event.type },
  });
} catch (err) {
  if (err?.code === "P2002") {
    // Unique constraint violation — duplicate delivery
    return new NextResponse("OK (duplicate, already processed)", { status: 200 });
  }
  throw err;
}
```

The `create()` either succeeds (first delivery — proceed with handling) or throws a unique constraint error (duplicate delivery — return 200 and skip). Returning 200 on the duplicate is important: returning a 4xx or 5xx would cause Stripe to retry the event indefinitely.

### Why `create()` rather than `upsert()`?

An `upsert()` would silently succeed on a duplicate rather than throwing. The `create()` + catch pattern makes the duplicate case explicit — it's handled code, not a no-op. It also means the error handling is clear: the only expected error is `P2002` (unique violation); anything else is rethrown as a real error.

---

## 9. Security defaults

### Content Security Policy with per-request nonces

Every response includes a `Content-Security-Policy` header built in `middleware.ts`. The `script-src` directive uses a nonce rather than `'unsafe-inline'` or a hash:

```
script-src 'self' 'nonce-{base64-uuid}' 'strict-dynamic'
```

A new `crypto.randomUUID()` is generated per request, base64-encoded, and threaded through as a header both on the *request* (so Next.js's RSC renderer reads it and injects it into `<script nonce="...">` tags) and on the *response* (so the browser enforces it). `'strict-dynamic'` allows nonce-trusted scripts to load their own dynamically-loaded chunk scripts — this is required for Next.js's code splitting to work under a strict CSP, since the entry script loads many more scripts at runtime.

`style-src` retains `'unsafe-inline'` deliberately. Every component in the app uses React's `style={{}}` prop, which renders as a `style="..."` HTML attribute. CSP's `style-src` governs those attributes, not just `<style>` tags. Removing `'unsafe-inline'` from `style-src` would break every styled component's initial render. The accepted trade-off: XSS via script injection is the meaningful attack vector that CSP protects against; the tight `script-src` is the important part.

### Rate limiting on magic-link sign-in

`lib/rate-limit.ts` implements IP-based rate limiting specifically on `POST /api/auth/signin/email` — the endpoint that triggers magic-link emails. Without this, anyone who knows a victim's email address can send them an unlimited number of sign-in emails, either to harass them or to run up the app's Resend bill.

The limiter is 5 requests per 10-minute sliding window per IP, via Upstash Redis (HTTP-based, works in the Edge runtime where a normal Redis client wouldn't). The implementation fails open: if `UPSTASH_REDIS_REST_URL` isn't set, `isEmailSigninRateLimited()` returns `false` and all requests pass through. This is intentional — a missing env var in local dev shouldn't break sign-in entirely.

### Stripe webhook signature verification

All Stripe webhook events are verified via `stripe.webhooks.constructEvent()` before any processing. This uses the webhook signing secret to verify that the payload came from Stripe and hasn't been tampered with. An invalid signature returns a 400 before any DB operations run.

The route handler uses `await req.text()` to read the raw body before any JSON parsing — `constructEvent()` needs the raw bytes to verify the signature, and Next.js's default body parsing would consume and transform the stream before that could happen.

---

## 10. Soft delete and data retention

Account deletion is handled with a 30-day recovery window rather than an immediate cascade. When an org deletes their account, `Organization.deletionScheduledAt` is set to `now()`. The org and all its data remain in the database.

A daily cron job (`/api/cron/purge-deleted-orgs`, secured by shared secret) finds organizations where `deletionScheduledAt < now() - 30 days` and executes the actual cascade delete.

### Why not immediate deletion?

Two reasons:

1. **Recovery.** A user who deletes their account by accident can contact support within 30 days and have it restored by clearing `deletionScheduledAt`. Without this, a restore would require a point-in-time database recovery — expensive, manual, and not possible on a free/entry-level database tier.

2. **Compliance data.** EU AI Act compliance documents are legally significant records. Immediately deleting them on account closure could, in some interpretations, create a compliance gap for the org that just closed. A 30-day window gives orgs time to export their documents before the data is gone.

The trade-off: the DB holds "deleted" data for 30 days. For a GDPR-regulated product handling compliance data, this needs a clear data retention policy in the privacy notice. The scheduled deletion date is visible in the admin view so it can be communicated to users.

---

## 11. Feature flagging via `_disabled`

Next.js's file-based router ignores directories prefixed with `_`. The `app/_disabled/` directory holds routes and components for features that were built but pulled from the current release — in this case, an invite-link feature for multi-user orgs.

This is preferable to:

- **A feature flag in code** (`if (FEATURE_INVITE_LINKS)`) — adds conditional logic that has to be maintained; the disabled path still runs through the build
- **A separate branch** — makes it easy to lose track of what was parked vs. what's active; requires a merge to resurrect
- **Deletion** — irreversible; git history is possible but inconvenient

With `_disabled`, the code is dead but present, type-checked on every build (which catches drift — if the interfaces it depends on change, the disabled code will type-error and make the break visible), and trivially reinstatable by renaming the directory.

---

## 12. Data model overview

Key relationships and non-obvious design decisions:

### `AIToolLibrary` vs. `OrganizationAITool`

There are two tool models. `AIToolLibrary` is a global, seeded catalog of ~40 common AI tools with pre-classified risk levels, categories, and compliance notes. `OrganizationAITool` is an org-specific tool record — either linked to a `libraryTool` (if the user picked from the catalog) or defined entirely with `customName` / `customProvider` (if they entered a tool not in the library).

This separation means:
- New tools can be added to the library and immediately available to all orgs
- An org's tool record carries org-specific overrides (their usage description, accountable person, data types, etc.) independently of the library entry
- Risk levels default from the library entry but can be adjusted per-org

### `ComplianceDocument` uniqueness

`@@unique([organizationId, type])` — one document per type per org. This means there's no versioning table: old content is overwritten on regeneration, and the `version` integer increments as a lightweight audit trail. A full version history wasn't in scope; the document's `finalizedAt` timestamp is the key audit artifact.

### `ProcessedWebhookEvent` cleanup

The `ProcessedWebhookEvent` table grows unboundedly as written — there's no cleanup job. For the scale this product was targeting, that's acceptable (thousands of events over months, not millions). A production-ready version would add a `processedAt`-based TTL cleanup to the purge cron.

### `TrainingRecord` uniqueness

`@@unique([organizationId, staffEmail, trainingType])` — one record per person per training type. This means a person can complete multiple distinct trainings (EU AI Act basics + tool-specific training) without one overwriting the other, but they can't have two records for the same training type — the second `create()` would conflict and the route handler returns a meaningful error rather than a silent overwrite.

---

## 13. Deployment considerations

### Neon: pooled vs. direct connection

`schema.prisma` defines two database URLs:

```prisma
datasource db {
  url       = env("DATABASE_URL")   // pooled — used by the application at runtime
  directUrl = env("DIRECT_URL")     // direct — used by Prisma migrate/push
}
```

Neon's serverless Postgres uses a connection pooler (PgBouncer) that multiplexes many short-lived connections from serverless functions into a smaller pool of long-lived database connections. Prisma's `db push` and migrations need a direct (non-pooled) connection because the pooler doesn't support some of the DDL operations Prisma uses. At runtime, the application uses the pooled URL.

### `prisma generate` on Vercel

`package.json` includes `"postinstall": "prisma generate"`. Vercel runs `npm install` (and therefore `postinstall`) during the build step. This ensures the generated Prisma client is always built fresh from the current schema during deployment, rather than relying on a committed generated client that might be out of date.

### Edge middleware constraints

`middleware.ts` runs in the Edge runtime, which means no Node.js APIs, no native modules, and no `require()`. The auth check uses `next-auth/jwt`'s `getToken()` which is Edge-compatible. The rate limiter uses Upstash's HTTP-based Redis client (also Edge-compatible), not a traditional TCP Redis connection which would fail in the Edge runtime.

### Sentry initialisation

Three Sentry config files cover three runtimes:
- `sentry.client.config.ts` — browser
- `sentry.server.config.ts` — Node.js (RSC, route handlers)
- `sentry.edge.config.ts` — Edge (middleware)

`instrumentation.ts` uses Next.js's `register()` hook to initialise the server and edge Sentry SDKs at startup. This is the correct pattern for Next.js 14+ — the older `_app.tsx`-based initialisation doesn't work for App Router.
