// app/api/compliance/score/route.ts
// GET  → returns current score for the session's org
// POST → recalculates score from live data and saves it

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateComplianceScore } from "@/lib/compliance/scorer";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const score = await prisma.complianceScore.findUnique({
    where: { organizationId: session.orgId },
  });

  if (!score) {
    return NextResponse.json({ error: "No score found" }, { status: 404 });
  }

  return NextResponse.json(score);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all the data needed to recalculate
  const [org, tools, documents, trainingRecords] = await Promise.all([
    prisma.organization.findUnique({ where: { id: session.orgId } }),
    prisma.organizationAITool.findMany({
      where: { organizationId: session.orgId },
      include: { libraryTool: true },
    }),
    prisma.complianceDocument.findMany({
      where: { organizationId: session.orgId },
    }),
    prisma.trainingRecord.findMany({
      where: { organizationId: session.orgId },
    }),
  ]);

  if (!org) {
    return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
  }

  const result = calculateComplianceScore(org as any, tools as any, documents, trainingRecords);

  // Upsert — overwrite previous score
  const saved = await prisma.complianceScore.upsert({
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

  // Return the rich result (includes messages + action labels) not just the DB row
  return NextResponse.json({ ...saved, detail: result });
}
