// app/api/tools/[id]/route.ts
// PATCH  → update a tool (department, accountable person, vendor compliance, etc.)
// DELETE → deactivate a tool (soft delete)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { calculateComplianceScore } from "@/lib/compliance/scorer";

const UpdateSchema = z.object({
  department:         z.string().optional().nullable(),
  usageDescription:   z.string().optional().nullable(),
  accountablePerson:  z.string().optional().nullable(),
  accountableEmail:   z.string().optional().nullable(),
  oversightProcedure: z.string().optional().nullable(),
  vendorCompliance:   z.boolean().optional().nullable(),
  status:             z.enum(["ACTIVE", "INACTIVE", "UNDER_REVIEW"]).optional(),
}).partial();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tool = await prisma.organizationAITool.findUnique({ where: { id: params.id } });
  if (!tool || tool.organizationId !== session.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body   = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const updated = await prisma.organizationAITool.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      lastReviewedAt: new Date(),
    },
    include: { libraryTool: true },
  });

  // These fields are rendered directly into generated documents (AUP tool
  // table, Register, Oversight Procedure per-tool sections) — editing any of
  // them makes existing documents stale until regenerated.
  const contentFieldsChanged = [
    "department", "usageDescription", "accountablePerson",
    "accountableEmail", "oversightProcedure", "vendorCompliance",
  ].some((key) => key in parsed.data);

  if (contentFieldsChanged) {
    await prisma.complianceDocument.updateMany({
      where: { organizationId: session.orgId },
      data: { status: "NEEDS_UPDATE", staleReason: "TOOLS_CHANGED" },
    });
  }

  // Recalculate score — vendor compliance changes affect the score
  const [org, tools, documents, trainingRecords] = await Promise.all([
    prisma.organization.findUnique({ where: { id: session.orgId } }),
    prisma.organizationAITool.findMany({ where: { organizationId: session.orgId } }),
    prisma.complianceDocument.findMany({ where: { organizationId: session.orgId } }),
    prisma.trainingRecord.findMany({ where: { organizationId: session.orgId } }),
  ]);

  if (org) {
    const result = calculateComplianceScore(org as any, tools as any, documents, trainingRecords);
    await prisma.complianceScore.upsert({
      where: { organizationId: session.orgId },
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
        organizationId:      session.orgId,
        overallScore:        result.overallScore,
        article4Literacy:    result.article4Literacy.status,
        acceptableUsePolicy: result.acceptableUsePolicy.status,
        aiSystemRegister:    result.aiSystemRegister.status,
        humanOversight:      result.humanOversight.status,
        vendorDueDiligence:  result.vendorDueDiligence.status,
      },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tool = await prisma.organizationAITool.findUnique({ where: { id: params.id } });
  if (!tool || tool.organizationId !== session.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Soft delete — mark INACTIVE rather than destroying audit trail
  await prisma.organizationAITool.update({
    where: { id: params.id },
    data: { status: "INACTIVE" },
  });

  // Mark documents as needing update
  await prisma.complianceDocument.updateMany({
    where: { organizationId: session.orgId },
    data: { status: "NEEDS_UPDATE", staleReason: "TOOLS_CHANGED" },
  });

  return NextResponse.json({ success: true });
}
