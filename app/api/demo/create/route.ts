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

import { NextRequest, NextResponse }  from "next/server";
import { prisma }                     from "@/lib/db";
import { encode }                     from "next-auth/jwt";
import { generateAllDocuments }       from "@/lib/compliance/generator";
import { calculateComplianceScore }   from "@/lib/compliance/scorer";
import {
  RiskLevel,
  ToolCategory,
  DocumentStatus,
  TrainingType,
  MemberRole,
}                                     from "@prisma/client";
import { getClientIp }                from "@/lib/rate-limit";

// ─── Demo content ─────────────────────────────────────────────────────────────
//
// Designed to show a realistic but clearly partial compliance posture:
//   • Mix of risk levels so all document types are populated
//   • AUP finalised, register still DRAFT → score ~65%
//   • 3/5 staff trained → literacy obligation partial
//   • One HIGH risk tool with no oversight procedure filled in → oversight partial
//   • Vendor compliance checked on some tools but not all → due-diligence partial
//
// This is more useful as a demo than a 100% score, which looks fake and
// gives the viewer nothing to interact with.

const DEMO_ORG = {
  name:            "Hartmann & Partner GmbH",
  country:         "DE",
  sector:          "PROFESSIONAL_SERVICES",
  employeeCount:   28,
  vatNumber:       "DE298765432",
  contactEmail:    "compliance@hartmann-partner.example.com",
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
    dataTypes:        ["TEXT", "DOCUMENTS"],
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
    dataTypes:        ["TEXT"],
  },
  {
    libraryToolName:  "Zoom AI Companion",
    category:         ToolCategory.PRODUCTIVITY,
    riskLevel:        RiskLevel.LIMITED,
    usageDescription: "Meeting transcription and summary for internal team calls.",
    department:       "All departments",
    accountablePerson:"Maria Hartmann",
    accountableEmail: "m.hartmann@hartmann-partner.example.com",
    vendorCompliance: false,   // checked — confirmed not yet compliant
    dataTypes:        ["AUDIO", "TEXT", "BEHAVIOURAL"],
  },
  {
    libraryToolName:  "Workable AI",
    category:         ToolCategory.RECRUITING_HR,
    riskLevel:        RiskLevel.HIGH,
    usageDescription: "AI-assisted candidate screening for open positions.",
    department:       "HR",
    accountablePerson:"Anna Bauer",
    accountableEmail: "a.bauer@hartmann-partner.example.com",
    vendorCompliance: null,    // not yet checked — shows up as gap
    dataTypes:        ["TEXT", "PERSONAL", "PROFESSIONAL"],
    // oversightProcedure intentionally left null → oversight obligation partial
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
    dataTypes:        ["TEXT"],
  },
];

const DEMO_TRAINING = [
  {
    staffName:    "Maria Hartmann",
    staffEmail:   "m.hartmann@hartmann-partner.example.com",
    trainingType: TrainingType.EU_AI_ACT_BASICS,
    completedAt:  new Date("2025-03-12"),
    notes:        "Completed EU AI Office online course",
  },
  {
    staffName:    "Klaus Weber",
    staffEmail:   "k.weber@hartmann-partner.example.com",
    trainingType: TrainingType.EU_AI_ACT_BASICS,
    completedAt:  new Date("2025-03-18"),
    notes:        "Internal team session",
  },
  {
    staffName:    "Anna Bauer",
    staffEmail:   "a.bauer@hartmann-partner.example.com",
    trainingType: TrainingType.EU_AI_ACT_BASICS,
    completedAt:  new Date("2025-04-02"),
    notes:        "Completed EU AI Office online course",
  },
  // Thomas König and others deliberately untrained → literacy obligation partial
];

// ─── Rate limiting ────────────────────────────────────────────────────────────

const DEMO_RATE_LIMIT = 10; // attempts per hour per IP

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
    const ip            = getClientIp(req);
    const { success }   = await limiter.limit(ip);
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
      data: {
        email: demoEmail,
        name:  "Demo User",
      },
    });

    // 2. Create the demo org (immediately scheduled for deletion — self-cleaning)
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const org = await prisma.organization.create({
      data: {
        ...DEMO_ORG,
        deletionScheduledAt: thirtyDaysFromNow,
        members: {
          create: {
            userId: user.id,
            role:   MemberRole.OWNER,
          },
        },
        // Free trial subscription so the dashboard doesn't gate anything
        subscription: {
          create: {
            plan:             "SOLO",
            status:           "TRIALING",
            currentPeriodEnd: thirtyDaysFromNow,
          },
        },
      },
    });

    // 3. Resolve library tool IDs and create org tools
    const libraryNames   = DEMO_TOOLS.map(t => t.libraryToolName);
    const libraryEntries = await prisma.aIToolLibrary.findMany({
      where: { name: { in: libraryNames } },
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
          data: {
            organizationId: org.id,
            ...record,
          },
        })
      )
    );

    // 5. Generate all documents from current org state
    const trainingRecords = await prisma.trainingRecord.findMany({
      where: { organizationId: org.id },
    });

    const generated = generateAllDocuments(
      org as any,
      createdTools as any,
      trainingRecords
    );

    // Store documents: AUP and Training Record as FINALIZED (to show the
    // "some done, some not" state), the rest as DRAFT
    const finalised = new Set(["ACCEPTABLE_USE_POLICY", "LITERACY_TRAINING_RECORD"]);
    await Promise.all(
      generated.map(doc =>
        prisma.complianceDocument.create({
          data: {
            organizationId: org.id,
            type:           doc.type,
            content:        doc as any,
            status:         finalised.has(doc.type) ? DocumentStatus.FINALIZED : DocumentStatus.DRAFT,
            generatedAt:    new Date(),
            finalizedAt:    finalised.has(doc.type) ? new Date() : null,
            version:        1,
          },
        })
      )
    );

    // 6. Calculate and store compliance score
    const [orgFull, toolsFull, documentsFull, trainingFull] = await Promise.all([
      prisma.organization.findUnique({ where: { id: org.id } }),
      prisma.organizationAITool.findMany({
        where: { organizationId: org.id },
        include: { libraryTool: true },
      }),
      prisma.complianceDocument.findMany({ where: { organizationId: org.id } }),
      prisma.trainingRecord.findMany({ where: { organizationId: org.id } }),
    ]);

    const scoreResult = calculateComplianceScore(
      orgFull as any,
      toolsFull as any,
      documentsFull,
      trainingFull
    );

    await prisma.complianceScore.upsert({
      where:  { organizationId: org.id },
      update: { ...scoreResult, updatedAt: new Date() },
      create: { organizationId: org.id, ...scoreResult },
    });

    // 7. Mint a NextAuth JWT for this user and set it in a cookie
    //    The token carries the same claims the normal JWT callback would set.
    const token = await encode({
      token: {
        sub:    user.id,
        userId: user.id,
        email:  user.email,
        name:   user.name,
        orgId:  org.id,
        orgRole: MemberRole.OWNER,
        hasOrg: true,
        // Mark as demo so the dashboard can show the demo banner
        isDemo: true,
      },
      secret: process.env.NEXTAUTH_SECRET!,
    });

    const cookieName = process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    const response = NextResponse.redirect(
      new URL("/dashboard?demo=1", req.url)
    );

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure:   process.env.NODE_ENV === "production",
      path:     "/",
      maxAge:   60 * 60 * 2, // 2 hours — enough for a demo session
    });

    return response;

  } catch (err) {
    console.error("Demo creation failed:", err);
    return NextResponse.json(
      { error: "Demo creation failed. Please try again." },
      { status: 500 }
    );
  }
}
