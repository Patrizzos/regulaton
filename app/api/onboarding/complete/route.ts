// app/api/onboarding/complete/route.ts
//
// Called by the wizard on final step. Does everything in one transaction:
//   1. Creates the organisation
//   2. Makes the current user OWNER
//   3. Adds all selected tools (linked to library or custom)
//   4. Generates all 4 compliance documents
//   5. Calculates first compliance score
//   6. Creates a 14-day trial subscription
//   7. Creates initial alerts
//
// If anything fails, the whole thing rolls back (Prisma transaction).

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateAllDocuments } from "@/lib/compliance/generator";
import { calculateComplianceScore } from "@/lib/compliance/scorer";
import {
  EmployeeRange,
  OrgRole,
  RiskLevel,
  ToolCategory,
  MemberRole,
  DocumentStatus,
  Plan,
  SubscriptionStatus,
  AlertType,
} from "@prisma/client";
import { z } from "zod";
import { addDays } from "date-fns";

// ─── Request schema ───────────────────────────────────────────────────────────

const SelectedToolSchema = z.object({
  id: z.string(),                              // library tool id (or "custom")
  name: z.string(),
  providerCompany: z.string(),
  category: z.string(),
  defaultRiskLevel: z.string(),
  riskLevelOverride: z.string().optional(),
  department: z.string().optional(),
  usageDescription: z.string().optional(),
  accountablePerson: z.string().optional(),
  accountableEmail: z.string().optional(),
  oversightProcedure: z.string().optional(),
});

const OrgDetailsSchema = z.object({
  name: z.string().min(1),
  country: z.string().min(2).max(2),
  industry: z.string().optional(),
  employeeCount: z.enum(["SOLO", "MICRO", "SMALL", "MEDIUM"]),
  orgRole: z.enum(["DEPLOYER", "PROVIDER", "BOTH"]),
});

const RequestSchema = z.object({
  orgDetails: OrgDetailsSchema,
  tools: z.array(SelectedToolSchema),
});

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Check user doesn't already have an org
  const existingMembership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
  });
  if (existingMembership) {
    return NextResponse.json(
      { error: "User already has an organisation" },
      { status: 409 }
    );
  }

  // 3. Parse + validate body
  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { orgDetails, tools } = parsed.data;

  try {
    // 4. Everything in a transaction
    const result = await prisma.$transaction(async (tx) => {

      // ── Create organisation ──────────────────────────────────────────────
      const org = await tx.organization.create({
        data: {
          name: orgDetails.name,
          country: orgDetails.country,
          industry: orgDetails.industry ?? null,
          employeeCount: orgDetails.employeeCount as EmployeeRange,
          orgRole: orgDetails.orgRole as OrgRole,
        },
      });

      // ── Add current user as OWNER ────────────────────────────────────────
      await tx.organizationMember.create({
        data: {
          userId: session.user.id,
          organizationId: org.id,
          role: MemberRole.OWNER,
        },
      });

      // ── Add tools to inventory ───────────────────────────────────────────
      const createdTools = await Promise.all(
        tools.map(async (tool) => {
          const effectiveRisk = (tool.riskLevelOverride ?? tool.defaultRiskLevel) as RiskLevel;

          // Check if this tool exists in library
          const libraryTool = await tx.aIToolLibrary.findUnique({
            where: { id: tool.id },
          });

          return tx.organizationAITool.create({
            data: {
              organizationId: org.id,
              libraryToolId: libraryTool ? tool.id : null,
              customName: libraryTool ? null : tool.name,
              customProvider: libraryTool ? null : tool.providerCompany,
              riskLevel: effectiveRisk,
              category: tool.category as ToolCategory,
              department: tool.department ?? null,
              usageDescription: tool.usageDescription ?? null,
              accountablePerson: tool.accountablePerson ?? null,
              accountableEmail: tool.accountableEmail ?? null,
              oversightProcedure: tool.oversightProcedure ?? null,
              // Mark vendor compliance based on library data
              vendorCompliance: libraryTool?.vendorActStatement ?? null,
              nextReviewAt: addDays(new Date(), 365),
            },
            include: {
              libraryTool: true,
            },
          });
        })
      );

      // ── Generate all 4 documents ─────────────────────────────────────────
      // We need to pass the full org object — create a compatible shape
      const orgForGenerator = {
        ...org,
        members: [],
        aiTools: [],
        documents: [],
        trainingRecords: [],
        subscription: null,
        alerts: [],
        complianceScore: null,
      };

      const documents = generateAllDocuments(orgForGenerator as any, createdTools as any, []);

      const savedDocuments = await Promise.all(
        documents.map((doc) =>
          tx.complianceDocument.create({
            data: {
              organizationId: org.id,
              type: doc.type,
              status: DocumentStatus.DRAFT, // user needs to review + finalise
              content: doc as any,
              version: 1,
            },
          })
        )
      );

      // ── Calculate initial compliance score ───────────────────────────────
      const scoreResult = calculateComplianceScore(
        orgForGenerator as any,
        createdTools as any,
        savedDocuments,
        []
      );

      await tx.complianceScore.create({
        data: {
          organizationId: org.id,
          overallScore: scoreResult.overallScore,
          article4Literacy: scoreResult.article4Literacy.status,
          acceptableUsePolicy: scoreResult.acceptableUsePolicy.status,
          aiSystemRegister: scoreResult.aiSystemRegister.status,
          humanOversight: scoreResult.humanOversight.status,
          vendorDueDiligence: scoreResult.vendorDueDiligence.status,
        },
      });

      // ── Create 14-day trial subscription ────────────────────────────────
      const plan = employeeCountToPlan(orgDetails.employeeCount);
      await tx.subscription.create({
        data: {
          organizationId: org.id,
          plan,
          status: SubscriptionStatus.TRIALING,
          trialEndsAt: addDays(new Date(), 14),
        },
      });

      // ── Create initial alerts ────────────────────────────────────────────
      const alerts = buildInitialAlerts(org.id, scoreResult, createdTools as any);
      if (alerts.length > 0) {
        await tx.alert.createMany({ data: alerts });
      }

      return {
        orgId: org.id,
        score: scoreResult.overallScore,
        documentCount: savedDocuments.length,
        toolCount: createdTools.length,
      };
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });

  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding. Please try again." },
      { status: 500 }
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function employeeCountToPlan(employeeCount: string): Plan {
  switch (employeeCount) {
    case "SOLO":
    case "MICRO":
      return Plan.SOLO;
    case "SMALL":
      return Plan.SMB;
    case "MEDIUM":
      return Plan.BUSINESS;
    default:
      return Plan.SOLO;
  }
}

function buildInitialAlerts(
  orgId: string,
  score: ReturnType<typeof calculateComplianceScore>,
  tools: { riskLevel: RiskLevel; accountablePerson: string | null }[]
) {
  const alerts: {
    organizationId: string;
    type: AlertType;
    title: string;
    message: string;
    actionUrl?: string;
  }[] = [];

  // Alert: AUP needs to be reviewed and finalised
  alerts.push({
    organizationId: orgId,
    type: AlertType.DOCUMENT_NEEDS_UPDATE,
    title: "Review and finalise your Acceptable Use Policy",
    message:
      "Your AI Acceptable Use Policy has been generated as a draft. Review it, make any edits, and mark it as finalised to satisfy Article 4 of the EU AI Act.",
    actionUrl: "/documents/acceptable-use-policy",
  });

  // Alert: add training records
  alerts.push({
    organizationId: orgId,
    type: AlertType.TRAINING_REMINDER,
    title: "Add staff AI literacy training records",
    message:
      "Article 4 requires documented evidence of staff AI literacy training. Add a record for each team member who uses AI tools.",
    actionUrl: "/training",
  });

  // Alert: high-risk tools without oversight procedures
  const highRiskNoOversight = tools.filter(
    (t) => t.riskLevel === RiskLevel.HIGH && !t.accountablePerson
  );
  if (highRiskNoOversight.length > 0) {
    alerts.push({
      organizationId: orgId,
      type: AlertType.COMPLIANCE_RISK,
      title: `${highRiskNoOversight.length} high-risk tool${highRiskNoOversight.length === 1 ? "" : "s"} need oversight procedures`,
      message:
        "You have high-risk AI tools (likely recruiting software) that require documented human oversight procedures under Annex III of the EU AI Act. Complete these in your inventory.",
      actionUrl: "/inventory",
    });
  }

  return alerts;
}
