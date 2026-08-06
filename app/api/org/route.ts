// app/api/org/route.ts
// PATCH → update organisation settings

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const UpdateOrgSchema = z.object({
  name:           z.string().min(1).optional(),
  country:        z.string().length(2).optional(),
  industry:       z.string().nullable().optional(),
  vatNumber:      z.string().nullable().optional(),
  trainingTarget: z.number().int().min(1).max(10000).nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json();
  const parsed = UpdateOrgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const before = await prisma.organization.findUnique({
    where: { id: session.orgId },
    select: { name: true, country: true },
  });

  const org = await prisma.organization.update({
    where: { id: session.orgId },
    data:  parsed.data,
  });

  // name and country are baked directly into every generated document (title
  // lines, footer, the Register's summary line) — if either actually changed,
  // existing documents now show stale org info until regenerated. industry,
  // vatNumber, and trainingTarget aren't referenced in lib/compliance/generator.ts,
  // so they don't need to trigger this.
  const contentFieldsChanged =
    (parsed.data.name    !== undefined && parsed.data.name    !== before?.name) ||
    (parsed.data.country !== undefined && parsed.data.country !== before?.country);

  if (contentFieldsChanged) {
    await prisma.complianceDocument.updateMany({
      where: { organizationId: session.orgId },
      data:  { status: "NEEDS_UPDATE", staleReason: "ORG_CHANGED" },
    });
  }

  return NextResponse.json({
    name:           org.name,
    country:        org.country,
    industry:       org.industry,
    vatNumber:      org.vatNumber,
    trainingTarget: org.trainingTarget,
  });
}
