// app/api/training/[id]/route.ts
// PATCH  → edit an existing training record
// DELETE → remove a training record

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { normalizeEmail } from "@/lib/normalize";

const UpdateSchema = z.object({
  staffName:    z.string().min(1).optional(),
  staffEmail:   z.string().email().transform(normalizeEmail).optional(),
  completedAt:  z.string().optional(),
  trainingType: z.string().optional(),
  notes:        z.string().optional(),
  evidenceUrl:  z.string().url().optional().or(z.literal("")),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.trainingRecord.findUnique({ where: { id: params.id } });
  if (!existing || existing.organizationId !== session.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body   = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const { staffName, staffEmail, completedAt, trainingType, notes, evidenceUrl } = parsed.data;

  try {
    const record = await prisma.trainingRecord.update({
      where: { id: params.id },
      data: {
        ...(staffName    !== undefined ? { staffName } : {}),
        ...(staffEmail   !== undefined ? { staffEmail } : {}),
        ...(completedAt  !== undefined ? { completedAt: new Date(completedAt) } : {}),
        ...(trainingType !== undefined ? { trainingType } : {}),
        ...(notes        !== undefined ? { notes: notes || null } : {}),
        ...(evidenceUrl  !== undefined ? { evidenceUrl: evidenceUrl || null } : {}),
      },
    });

    await recalculateScore(session.orgId);

    return NextResponse.json(record);
  } catch (err) {
    // Changing staffEmail/trainingType can collide with another existing row
    // for that same (org, email, type) — surface that clearly rather than a 500.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "A record for this person and training type already exists. Edit that record instead, or choose a different training type." },
        { status: 409 }
      );
    }
    throw err;
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify the record belongs to this org before deleting
  const record = await prisma.trainingRecord.findUnique({
    where: { id: params.id },
  });

  if (!record || record.organizationId !== session.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.trainingRecord.delete({ where: { id: params.id } });

  await recalculateScore(session.orgId);

  return NextResponse.json({ success: true });
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
