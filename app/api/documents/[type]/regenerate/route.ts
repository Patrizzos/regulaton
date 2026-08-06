// app/api/documents/[type]/regenerate/route.ts
// Regenerates a single document from current org/tool data.
// Called when status is NEEDS_UPDATE after inventory changes.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TYPE_FROM_SLUG } from "@/lib/documents";
import { generateDocument } from "@/lib/compliance/generator";
import { DocumentStatus } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { type: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const docType = TYPE_FROM_SLUG[params.type];
  if (!docType) {
    return NextResponse.json({ error: "Unknown document type" }, { status: 400 });
  }

  const [org, tools, trainingRecords] = await Promise.all([
    prisma.organization.findUnique({ where: { id: session.orgId } }),
    prisma.organizationAITool.findMany({
      where: { organizationId: session.orgId, status: "ACTIVE" },
      include: { libraryTool: true },
    }),
    prisma.trainingRecord.findMany({
      where: { organizationId: session.orgId },
    }),
  ]);

  if (!org) {
    return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
  }

  // Generate fresh content
  const generated = generateDocument(docType, org as any, tools as any, trainingRecords);

  // Upsert — update if exists, create if not
  const doc = await prisma.complianceDocument.upsert({
    where: {
      organizationId_type: {
        organizationId: session.orgId,
        type: docType,
      },
    },
    update: {
      content:     generated as any,
      status:      DocumentStatus.DRAFT,  // back to draft after regeneration — needs review
      staleReason: null,
      finalizedAt: null,
      generatedAt: new Date(),
      updatedAt:   new Date(),
      version:     { increment: 1 },
    },
    create: {
      organizationId: session.orgId,
      type:           docType,
      content:        generated as any,
      status:         DocumentStatus.DRAFT,
      generatedAt:    new Date(),
      version:        1,
    },
  });

  return NextResponse.json({ success: true, status: doc.status, version: doc.version });
}
