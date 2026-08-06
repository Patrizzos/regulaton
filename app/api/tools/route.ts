// app/api/tools/route.ts
// GET  → list org's AI tools + library search
// POST → add a new tool to the org's inventory

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RiskLevel, ToolCategory, ToolStatus } from "@prisma/client";
import { z } from "zod";
import { addDays } from "date-fns";

// GET /api/tools?library=true&q=hubspot — search the library
// GET /api/tools — list org's own tools
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const isLibrary = searchParams.get("library") === "true";
  const q         = searchParams.get("q") ?? "";

  if (isLibrary) {
    const tools = await prisma.aIToolLibrary.findMany({
      where: {
        isActive: true,
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      take: 50,
    });
    return NextResponse.json(tools);
  }

  // Org's own tools
  const tools = await prisma.organizationAITool.findMany({
    where: { organizationId: session.orgId },
    include: { libraryTool: true },
    orderBy: [{ riskLevel: "asc" }, { addedAt: "desc" }],
  });

  return NextResponse.json(tools);
}

const AddToolSchema = z.object({
  libraryToolId:     z.string().optional(),
  customName:        z.string().optional(),
  customProvider:    z.string().optional(),
  riskLevel:         z.nativeEnum(RiskLevel),
  category:          z.nativeEnum(ToolCategory),
  department:        z.string().optional(),
  usageDescription:  z.string().optional(),
  accountablePerson: z.string().optional(),
  accountableEmail:  z.string().optional(),
  vendorCompliance:  z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json();
  const parsed = AddToolSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  if (!parsed.data.libraryToolId && !parsed.data.customName) {
    return NextResponse.json({ error: "Either libraryToolId or customName is required" }, { status: 400 });
  }

  const tool = await prisma.organizationAITool.create({
    data: {
      organizationId:    session.orgId,
      libraryToolId:     parsed.data.libraryToolId ?? null,
      customName:        parsed.data.customName ?? null,
      customProvider:    parsed.data.customProvider ?? null,
      riskLevel:         parsed.data.riskLevel,
      category:          parsed.data.category,
      department:        parsed.data.department ?? null,
      usageDescription:  parsed.data.usageDescription ?? null,
      accountablePerson: parsed.data.accountablePerson ?? null,
      accountableEmail:  parsed.data.accountableEmail ?? null,
      vendorCompliance:  parsed.data.vendorCompliance ?? null,
      nextReviewAt:      addDays(new Date(), 365),
    },
    include: { libraryTool: true },
  });

  // Mark documents as needing update since inventory changed
  await prisma.complianceDocument.updateMany({
    where: { organizationId: session.orgId },
    data: { status: "NEEDS_UPDATE", staleReason: "TOOLS_CHANGED" },
  });

  return NextResponse.json(tool, { status: 201 });
}
