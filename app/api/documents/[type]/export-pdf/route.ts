// app/api/documents/[type]/export-pdf/route.ts
// Generates and streams a paginated PDF of the document, using the same
// block content as the .docx export (see ../export/route.ts). Gated behind
// active subscription, same as the .docx export.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkAccess } from "@/lib/subscription";
import { TYPE_FROM_SLUG, DOC_META } from "@/lib/documents";
import { buildDocumentPdf } from "@/lib/documents-pdf";

export async function GET(
  req: NextRequest,
  { params }: { params: { type: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) return new NextResponse("Unauthorized", { status: 401 });

  // Subscription gate
  const access = await checkAccess(session.orgId);
  if (!access.allowed) {
    return new NextResponse(access.reason, { status: access.code });
  }

  const docType = TYPE_FROM_SLUG[params.type];
  if (!docType) return new NextResponse("Unknown document type", { status: 400 });

  const doc = await prisma.complianceDocument.findUnique({
    where: { organizationId_type: { organizationId: session.orgId, type: docType } },
    include: { organization: true },
  });

  if (!doc) return new NextResponse("Document not found", { status: 404 });

  const content = doc.content as any;
  const blocks  = content?.blocks ?? [];
  const meta    = DOC_META[docType];
  const orgName = doc.organization.name;
  const today   = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const pdfBytes = await buildDocumentPdf({
    title:          meta.title,
    articleRef:     meta.articleRef,
    orgName,
    generatedLabel: `Generated ${today}`,
    accentColor:    meta.accentColor,
    blocks,
  });

  const filename = `${orgName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${params.type}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length":      pdfBytes.length.toString(),
    },
  });
}
