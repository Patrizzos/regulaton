// app/api/documents/[type]/finalise/route.ts
// Marks a document as FINALIZED and recalculates compliance score.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DocumentStatus } from "@prisma/client";
import { TYPE_FROM_SLUG } from "@/lib/documents";
import { calculateComplianceScore } from "@/lib/compliance/scorer";
import { requireAccess } from "@/lib/subscription";

export async function POST(
  req: NextRequest,
  { params }: { params: { type: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const denied = await requireAccess(session.orgId);
  if (denied) return denied;

  const docType = TYPE_FROM_SLUG[params.type];
  if (!docType) {
    return NextResponse.json({ error: "Unknown document type" }, { status: 400 });
  }

  // Finalise the document
  await prisma.complianceDocument.update({
    where: {
      organizationId_type: {
        organizationId: session.orgId,
        type: docType,
      },
    },
    data: {
      status: DocumentStatus.FINALIZED,
      finalizedAt: new Date(),
    },
  });

  // Recalculate compliance score so dashboard updates immediately
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

  return NextResponse.json({ success: true });
}
