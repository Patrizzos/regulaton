// app/api/training/route.ts
// GET  → list all training records for the org
// POST → add a new training record

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { normalizeEmail } from "@/lib/normalize";
import { requireAccess } from "@/lib/subscription";
import { TRAINING_TYPE_LABELS } from "@/lib/training-labels";

const VALID_TRAINING_TYPES = Object.keys(TRAINING_TYPE_LABELS) as [string, ...string[]];

const CreateSchema = z.object({
  staffName:     z.string().min(1),
  staffEmail:    z.string().email().transform(normalizeEmail),
  completedAt:   z.string(), // ISO date string from the form
  trainingTypes: z.array(z.enum(VALID_TRAINING_TYPES)).min(1, "Select at least one training type"),
  notes:         z.string().optional(),
  evidenceUrl:   z.string().url().optional().or(z.literal("")),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const records = await prisma.trainingRecord.findMany({
    where: { organizationId: session.orgId },
    orderBy: { completedAt: "desc" },
  });

  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const denied = await requireAccess(session.orgId);
  if (denied) return denied;

  const body   = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const { staffName, staffEmail, completedAt, trainingTypes, notes, evidenceUrl } = parsed.data;

  // One submission can log several training types completed together (e.g.
  // "Basics" + "AUP review" done in the same session) — upsert one row per
  // type so each is tracked independently and re-submitting a given type
  // updates that record instead of clobbering a different one.
  const records = await Promise.all(
    trainingTypes.map((trainingType) =>
      prisma.trainingRecord.upsert({
        where: {
          organizationId_staffEmail_trainingType: {
            organizationId: session.orgId!,
            staffEmail,
            trainingType,
          },
        },
        update: {
          staffName,
          completedAt: new Date(completedAt),
          notes:       notes || null,
          evidenceUrl: evidenceUrl || null,
        },
        create: {
          organizationId: session.orgId!,
          staffName,
          staffEmail,
          completedAt:    new Date(completedAt),
          trainingType,
          notes:          notes || null,
          evidenceUrl:    evidenceUrl || null,
        },
      })
    )
  );

  // Recalculate score
  await recalculateScore(session.orgId);

  return NextResponse.json(records, { status: 201 });
}

// Shared score recalc helper
async function recalculateScore(orgId: string) {
  const { calculateComplianceScore } = await import("@/lib/compliance/scorer");
  const [org, tools, documents, trainingRecords] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.organizationAITool.findMany({ where: { organizationId: orgId } }),
    prisma.complianceDocument.findMany({ where: { organizationId: orgId } }),
    prisma.trainingRecord.findMany({ where: { organizationId: orgId } }),
  ]);
  if (!org) return;
  const result = calculateComplianceScore(org as any, tools as any, documents, trainingRecords);
  await prisma.complianceScore.upsert({
    where: { organizationId: orgId },
    update: {
      overallScore:        result.overallScore,
      article4Literacy:    result.article4Literacy.status,
      acceptableUsePolicy: result.acceptableUsePolicy.status,
      aiSystemRegister:    result.aiSystemRegister.status,
      humanOversight:      result.humanOversight.status,
      vendorDueDiligence:  result.vendorDueDiligence.status,
      calculatedAt:        new Date(),
    },
    create: {
      organizationId:      orgId,
      overallScore:        result.overallScore,
      article4Literacy:    result.article4Literacy.status,
      acceptableUsePolicy: result.acceptableUsePolicy.status,
      aiSystemRegister:    result.aiSystemRegister.status,
      humanOversight:      result.humanOversight.status,
      vendorDueDiligence:  result.vendorDueDiligence.status,
    },
  });
}
