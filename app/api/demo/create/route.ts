// app/api/demo/create/route.ts
//
// Creates a pre-populated demo org and signs the visitor in directly,
// dropping them into the dashboard without requiring sign-up or onboarding.
//
// Each click creates a fresh isolated org — visitors get their own
// playground, nothing shared. Demo orgs are cleaned up by the existing
// purge cron once deletionScheduledAt is set (we set it immediately on
// creation so they self-clean after 30 days with zero manual maintenance).
//
// Rate-limited to 10 requests / hour per IP via Upstash (same helper as
// magic-link). If Upstash isn't configured it fails open — acceptable for
// a demo endpoint.

import { NextRequest, NextResponse } from "next/server";
import { prisma }                    from "@/lib/db";
import { encode }                    from "next-auth/jwt";
import { generateAllDocuments }      from "@/lib/compliance/generator";
import {
  RiskLevel,
  ToolCategory,
  DocumentStatus,
  DocumentType,
  EmployeeRange,
  OrgRole,
  MemberRole,
  DataType,
  Plan,
  SubscriptionStatus,
}                                    from "@prisma/client";
import { getClientIp }               from "@/lib/rate-limit";

// ─── Demo content ─────────────────────────────────────────────────────────────
//
// Designed to show a realistic but clearly partial compliance posture:
//   • Mix of risk levels so all document types are populated
//   • AUP finalised, register still DRAFT → score ~64%
//   • 3/5 staff trained → literacy obligation partial
//   • One HIGH risk tool with no oversight procedure → oversight partial
//   • Vendor compliance unchecked on Workable AI → due-diligence partial

const DEMO_ORG = {
  name:          "Hartmann & Partner GmbH",
  country:       "DE",
  industry:      "Professional Services",
  employeeCount: EmployeeRange.SMALL,    // 28 employees — SMALL tier
  orgRole:       OrgRole.DEPLOYER,
  vatNumber:     "DE298765432",
};

const DEMO_TOOLS = [
  {
    libraryToolName:  "ChatGPT",
    category:         ToolCategory.WRITING_CONTENT,
    riskLevel:        RiskLevel.LIMITED,
    usageDescription: "Drafting client reports, internal memos, and email responses.",
    department:       "Operations",
    accountablePerson:"Maria Hartmann",
    accountableEmail: "m.hartmann@hartmann-partner.example.com",
    vendorCompliance: true,
    dataTypes:        [] as DataType[],
  },
  {
    libraryToolName:  "GitHub Copilot",
    category:         ToolCategory.CODING_DEVELOPMENT,
    riskLevel:        RiskLevel.MINIMAL,
    usageDescription: "Code completion and review assistance for internal tooling.",
    department:       "Technology",
    accountablePerson:"Klaus Weber",
    accountableEmail: "k.weber@hartmann-partner.example.com",
    vendorCompliance: true,
    dataTypes:        [] as DataType[],
  },
  {
    libraryToolName:  "Zoom AI Companion",
    category:         ToolCategory.PRODUCTIVITY,
    riskLevel:        RiskLevel.LIMITED,
    usageDescription: "Meeting transcription and summary for internal team calls.",
    department:       "All departments",
    accountablePerson:"Maria Hartmann",
    accountableEmail: "m.hartmann@hartmann-partner.example.com",
    vendorCompliance: false,             // checked — confirmed not yet compliant
    dataTypes:        [DataType.PERSONAL_DATA] as DataType[],
  },
  {
    libraryToolName:  "Workable AI",
    category:         ToolCategory.RECRUITING_HR,
    riskLevel:        RiskLevel.HIGH,
    usageDescription: "AI-assisted candidate screening for open positions.",
    department:       "HR",
    accountablePerson:"Anna Bauer",
    accountableEmail: "a.bauer@hartmann-partner.example.com",
    vendorCompliance: null,              // not yet checked — shows as gap
    dataTypes:        [DataType.PERSONAL_DATA, DataType.HR_DATA] as DataType[],
    // oversightProcedure intentionally omitted → oversight obligation partial
  },
  {
    libraryToolName:  "Grammarly",
    category:         ToolCategory.WRITING_CONTENT,
    riskLevel:        RiskLevel.MINIMAL,
    usageDescription: "Writing assistance for client-facing documents.",
    department:       "All departments",
    accountablePerson:"Maria Hartmann",
    accountableEmail: "m.hartmann@hartmann-partner.example.com",
    vendorCompliance: true,
    dataTypes:        [] as DataType[],
  },
];

// trainingType is a plain String field in the schema — not a Prisma enum
const DEMO_TRAINING = [
  {
    staffName:    "Maria Hartmann",
    staffEmail:   "m.hartmann@hartmann-partner.example.com",
    trainingType: "EU_AI_ACT_LITERACY_BASICS",
    completedAt:  new Date("2025-03-12"),
    notes:        "Completed EU AI Office online course",
  },
  {
    staffName:    "Klaus Weber",
    staffEmail:   "k.weber@hartmann-partner.example.com",
    trainingType: "EU_AI_ACT_LITERACY_BASICS",
    completedAt:  new Date("2025-03-18"),
    notes:        "Internal team session",
  },
  {
    staffName:    "Anna Bauer",
    staffEmail:   "a.bauer@hartmann-partner.example.com",
    trainingType: "EU_AI_ACT_LITERACY_BASICS",
    completedAt:  new Date("2025-04-02"),
    notes:        "Completed EU AI Office online course",
  },
  // Thomas König and others deliberately untrained → literacy obligation partial
];

// ─── Rate limiting ─────────────────────────────────────────────────────────────

const DEMO_RATE_LIMIT = 10; // per hour per IP

async function isDemoRateLimited(req: NextRequest): Promise<boolean> {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis }     = await import("@upstash/redis");
    const redis         = new Redis({ url, token });
    const limiter       = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(DEMO_RATE_LIMIT, "1 h"),
      prefix:  "ratelimit:demo",
    });
    const { success } = await limiter.limit(getClientIp(req));
    return !success;
  } catch {
    return false; // fail open
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (await isDemoRateLimited(req)) {
    return NextResponse.json(
      { error: "Too many demo requests. Try again in an hour." },
      { status: 429 }
    );
  }

  try {
    // 1. Create a throw-away user for this demo session
    const demoEmail = `demo+${Date.now()}@regulaton-demo.internal`;
    const user = await prisma.user.create({
      data: { email: demoEmail, name: "Demo User" },
    });

    // 2. Create the org (scheduled for deletion immediately — self-cleaning)
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const org = await prisma.organization.create({
      data: {
        ...DEMO_ORG,
        deletionScheduledAt: thirtyDaysFromNow,
        members: {
          create: { userId: user.id, role: MemberRole.OWNER },
        },
        subscription: {
          create: {
            plan:             Plan.SOLO,
            status:           SubscriptionStatus.TRIALING,
            trialEndsAt:      thirtyDaysFromNow,
            currentPeriodEnd: thirtyDaysFromNow,
          },
        },
      },
    });

    // 3. Resolve library tool IDs and create org tools
    const libraryNames   = DEMO_TOOLS.map(t => t.libraryToolName);
    const libraryEntries = await prisma.aIToolLibrary.findMany({
      where:  { name: { in: libraryNames } },
      select: { id: true, name: true },
    });
    const libraryById = Object.fromEntries(libraryEntries.map(e => [e.name, e.id]));

    const createdTools = await Promise.all(
      DEMO_TOOLS.map(({ libraryToolName, ...toolData }) =>
        prisma.organizationAITool.create({
          data: {
            organizationId: org.id,
            libraryToolId:  libraryById[libraryToolName] ?? null,
            status:         "ACTIVE",
            addedAt:        new Date(),
            nextReviewAt:   new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            ...toolData,
          },
          include: { libraryTool: true },
        })
      )
    );

    // 4. Create training records
    await Promise.all(
      DEMO_TRAINING.map(record =>
        prisma.trainingRecord.create({
          data: { organizationId: org.id, ...record },
        })
      )
    );

    // 5. Generate all documents from current org + tool state
    const trainingRecords = await prisma.trainingRecord.findMany({
      where: { organizationId: org.id },
    });

    const generated = generateAllDocuments(
      org as any,
      createdTools as any,
      trainingRecords
    );

    // AUP and Training Record finalised; rest stay DRAFT.
    // This gives the demo a ~65% score with clear actions to take.
    const finalised = new Set<DocumentType>([
      DocumentType.ACCEPTABLE_USE_POLICY,
      DocumentType.LITERACY_TRAINING_RECORD,
    ]);

    await Promise.all(
      generated.map(doc =>
        prisma.complianceDocument.create({
          data: {
            organizationId: org.id,
            type:           doc.type,
            content:        doc as any,
            status:         finalised.has(doc.type)
                              ? DocumentStatus.FINALIZED
                              : DocumentStatus.DRAFT,
            generatedAt:    new Date(),
            finalizedAt:    finalised.has(doc.type) ? new Date() : null,
            version:        1,
          },
        })
      )
    );

    // 6. Hardcode a realistic partial compliance score.
    //    Avoids coupling the demo seed to the scorer's internal return shape.
    //    — AUP: COMPLIANT (finalised, has training records)
    //    — Literacy: PARTIAL (only 3/5 staff trained)
    //    — Register: PARTIAL (generated but not finalised)
    //    — Oversight: PARTIAL (high-risk tool, no procedure written yet)
    //    — Vendor: PARTIAL (Workable AI unchecked)
    //    Overall: (100 + 60 + 50 + 40 + 50) / 5 = 60
    await prisma.complianceScore.create({
      data: {
        organizationId:      org.id,
        overallScore:        60,
        article4Literacy:    "PARTIAL",
        acceptableUsePolicy: "COMPLIANT",
        aiSystemRegister:    "PARTIAL",
        humanOversight:      "PARTIAL",
        vendorDueDiligence:  "PARTIAL",
      },
    });

    // 7. Mint a NextAuth JWT and set it in a cookie, then redirect to the dashboard
    const sessionToken = await encode({
      token: {
        sub:     user.id,
        userId:  user.id,
        email:   user.email,
        name:    user.name,
        orgId:   org.id,
        orgRole: MemberRole.OWNER,
        hasOrg:  true,
        isDemo:  true,
      },
      secret: process.env.NEXTAUTH_SECRET!,
    });

    const cookieName = process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    const response = NextResponse.redirect(
      new URL("/dashboard?demo=1", req.url)
    );

    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure:   process.env.NODE_ENV === "production",
      path:     "/",
      maxAge:   60 * 60 * 2, // 2-hour demo session
    });

    return response;

  } catch (err) {
    console.error("[demo/create]", err);
    return NextResponse.json(
      { error: "Demo creation failed. Please try again." },
      { status: 500 }
    );
  }
}
