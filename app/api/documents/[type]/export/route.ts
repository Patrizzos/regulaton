// app/api/documents/[type]/export/route.ts
// Generates and streams a real .docx file. Gated behind active subscription.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkAccess } from "@/lib/subscription";
import { TYPE_FROM_SLUG, DOC_META } from "@/lib/documents";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
} from "docx";

function blockToElements(block: any): (Paragraph | Table)[] {
  switch (block.type) {
    case "heading": {
      const levelMap: Record<number, string> = {
        1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3,
      };
      return [new Paragraph({ text: block.text, heading: levelMap[block.level] ?? HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 } })];
    }
    case "paragraph":
      return [new Paragraph({ children: [new TextRun({ text: block.text, size: 22 })], spacing: { after: 160 } })];
    case "list":
      return block.items.map((item: string) =>
        new Paragraph({ children: [new TextRun({ text: item, size: 22 })], bullet: { level: 0 }, spacing: { after: 80 } })
      );
    case "table": {
      const cols = block.headers.length;
      const widths: number[] = block.columnWidths?.length === cols
        ? block.columnWidths
        : Array(cols).fill(100 / cols);
      const widthSum = widths.reduce((a: number, b: number) => a + b, 0);
      const pctWidths = widths.map((w: number) => (w / widthSum) * 100);

      // Wide tables (many columns) get smaller text and tighter margins so
      // long free-text fields (e.g. "Purpose", "Data types processed") wrap
      // within their own cell instead of forcing the table wider than the page.
      const isWide   = cols > 6;
      const dataSize = isWide ? 16 : 20;
      const headSize = isWide ? 14 : 18;
      const cellMargins = isWide
        ? { top: 60, bottom: 60, left: 80, right: 80 }
        : { top: 80, bottom: 80, left: 120, right: 120 };

      const headerRow = new TableRow({
        tableHeader: true,
        children: block.headers.map((h: string, i: number) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: headSize, color: "374151" })] })],
            shading: { type: ShadingType.CLEAR, fill: "F3F4F6" },
            margins: cellMargins,
            width: { size: pctWidths[i], type: WidthType.PERCENTAGE },
          })
        ),
      });
      const dataRows = block.rows.map((row: string[]) =>
        new TableRow({
          children: row.map((cell: string, i: number) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: cell, size: dataSize })] })],
              margins: cellMargins,
              width: { size: pctWidths[i], type: WidthType.PERCENTAGE },
            })
          ),
        })
      );
      return [
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] }),
        new Paragraph({ text: "", spacing: { after: 160 } }),
      ];
    }
    case "divider":
      return [new Paragraph({ text: "", border: { bottom: { color: "E5E7EB", space: 1, style: BorderStyle.SINGLE, size: 6 } }, spacing: { before: 200, after: 200 } })];
    case "note":
      return [new Paragraph({
        children: [new TextRun({ text: `ℹ  ${block.text}`, size: 20, color: "1A3A8F", italics: true })],
        shading: { type: ShadingType.CLEAR, fill: "EBF0FF" },
        indent: { left: 200, right: 200 },
        spacing: { before: 160, after: 160 },
        border: { left: { color: "1A3A8F", space: 10, style: BorderStyle.SINGLE, size: 12 } },
      })];
    case "signature":
      return [
        new Paragraph({ text: "", spacing: { before: 400 } }),
        new Paragraph({ children: [new TextRun({ text: "_".repeat(50), color: "D1D5DB" })] }),
        new Paragraph({ children: [new TextRun({ text: block.label, size: 20, color: "374151" })], spacing: { before: 80, after: 40 } }),
        new Paragraph({ children: [new TextRun({ text: `Date: ${block.date}`, size: 20, color: "4B5563" })] }),
      ];
    default:
      return [];
  }
}

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

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      children: [new TextRun({ text: meta.title.toUpperCase(), bold: true, size: 14, color: "4B5563", characterSpacing: 80 })],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: orgName, bold: true, size: 14, color: "374151" }),
        new TextRun({ text: `  ·  Generated ${today}`, size: 14, color: "4B5563" }),
      ],
      spacing: { after: 400 },
      border: { bottom: { color: "E5E7EB", space: 1, style: BorderStyle.SINGLE, size: 6 } },
    }),
    ...blocks.flatMap(blockToElements),
  ];

  const wordDoc = new Document({
    creator: "Regulaton",
    title:   `${meta.title} — ${orgName}`,
    styles: {
      default: { document: { run: { font: "Calibri", size: 22, color: "1A2332" } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", run: { font: "Georgia", size: 36, bold: true, color: "1A2332" }, paragraph: { spacing: { before: 480, after: 160 } } },
        { id: "Heading2", name: "Heading 2", run: { font: "Georgia", size: 28, bold: true, color: "1A2332" }, paragraph: { spacing: { before: 360, after: 120 } } },
        { id: "Heading3", name: "Heading 3", run: { font: "Calibri", size: 24, bold: true, color: "374151" }, paragraph: { spacing: { before: 240, after: 80 } } },
      ],
    },
    sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children }],
  });

  const buffer   = await Packer.toBuffer(wordDoc);
  const filename = `${orgName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${params.type}.docx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length":      buffer.length.toString(),
    },
  });
}
