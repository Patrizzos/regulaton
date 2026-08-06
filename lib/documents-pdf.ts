// lib/documents-pdf.ts
// Renders the same block-based document content used by the .docx export
// (see app/api/documents/[type]/export/route.ts) as a paginated PDF, using
// pdf-lib. Kept dependency-free of a headless browser so it works in any
// serverless/Node runtime without extra system deps.

import { PDFDocument, PDFFont, PDFPage, rgb, RGB, StandardFonts } from "pdf-lib";

// ─── Page geometry ─────────────────────────────────────────────────────────

const PAGE_WIDTH  = 595.28; // A4 @ 72dpi
const PAGE_HEIGHT = 841.89;
const MARGIN      = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_HEIGHT = 30;
const MIN_Y = MARGIN + FOOTER_HEIGHT;

// ─── Colours ────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

const COLOR = {
  text:      hexToRgb("1A2332"),
  textSub:   hexToRgb("374151"),
  textMuted: hexToRgb("4B5563"), // darkened from 9CA3AF — that was too low-contrast on white (kicker/meta/footer text)
  border:    hexToRgb("E5E7EB"),
  noteBg:    hexToRgb("EBF0FF"),
  noteText:  hexToRgb("1A3A8F"),
  tableHead: hexToRgb("F3F4F6"),
  tableText: hexToRgb("374151"),
  cellText:  hexToRgb("1F2937"),
};

// ─── Text sanitisation ──────────────────────────────────────────────────────
// pdf-lib's standard 14 fonts (Helvetica etc.) only support WinAnsi (CP1252)
// encoding. Since block content is AI-generated, it can contain characters
// outside that set (icons, arrows, checkmarks, emoji, ...) which pdf-lib
// throws on rather than skips. We swap common offenders for ASCII equivalents
// and silently drop anything else unsupported, so a single stray character
// can never 500 the whole export.

const WINANSI_EXTRAS = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160,
  0x2039, 0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014,
  0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
]);

const PDF_TEXT_REPLACEMENTS: [string, string][] = [
  ["ℹ", "(i)"],
  ["→", "->"],
  ["←", "<-"],
  ["⇒", "=>"],
  ["✓", "[x]"],
  ["✔", "[x]"],
  ["✗", "x"],
  ["✘", "x"],
  ["★", "*"],
  ["☆", "*"],
];

function sanitizeForPdf(text: string): string {
  let out = text;
  for (const [from, to] of PDF_TEXT_REPLACEMENTS) out = out.split(from).join(to);

  return Array.from(out)
    .map((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      if (code >= 0x20 && code <= 0x7e) return ch;   // ASCII printable
      if (code === 0x0a || code === 0x09) return ch; // newline / tab
      if (code >= 0xa0 && code <= 0xff) return ch;   // Latin-1 supplement
      if (WINANSI_EXTRAS.has(code)) return ch;       // CP1252 specials
      return "";                                     // drop anything unsupported
    })
    .join("");
}

// ─── Block types (mirrors the shape produced by the document generator) ────

type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][]; columnWidths?: number[] }
  | { type: "divider" }
  | { type: "note"; text: string }
  | { type: "signature"; label: string; date: string };

export interface BuildPdfOptions {
  title: string;
  articleRef: string;
  orgName: string;
  generatedLabel: string; // e.g. "Generated 4 August 2026"
  accentColor: string;    // hex, e.g. "#A78BFA"
  blocks: Block[];
}

// ─── Layout engine ──────────────────────────────────────────────────────────

class PdfWriter {
  doc!: PDFDocument;
  page!: PDFPage;
  y = 0;
  fonts!: { regular: PDFFont; bold: PDFFont; italic: PDFFont };
  pageNum = 0;
  accent: RGB;
  footerMeta: string;

  constructor(accent: RGB, footerMeta: string) {
    this.accent = accent;
    this.footerMeta = footerMeta;
  }

  async init(doc: PDFDocument) {
    this.doc = doc;
    this.fonts = {
      regular: await doc.embedFont(StandardFonts.Helvetica),
      bold:    await doc.embedFont(StandardFonts.HelveticaBold),
      italic:  await doc.embedFont(StandardFonts.HelveticaOblique),
    };
    this.addPage();
  }

  addPage() {
    if (this.page) this.drawFooter();
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.pageNum += 1;
    this.y = PAGE_HEIGHT - MARGIN;
  }

  drawFooter() {
    const label = `${this.footerMeta}  ·  Page ${this.pageNum}`;
    const size = 8;
    const width = this.fonts.regular.widthOfTextAtSize(label, size);
    this.page.drawText(label, {
      x: PAGE_WIDTH - MARGIN - width,
      y: MARGIN - 14,
      size,
      font: this.fonts.regular,
      color: COLOR.textMuted,
    });
  }

  ensureSpace(height: number) {
    if (this.y - height < MIN_Y) this.addPage();
  }

  wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = sanitizeForPdf(text).split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";

    const breakLongWord = (word: string): string[] => {
      // A single token (e.g. a long unbroken enum-like string or URL) can be
      // wider than the column itself with nowhere to break on whitespace.
      // Fall back to character-level wrapping so it can never overflow past
      // its column into the next one.
      const chunks: string[] = [];
      let chunk = "";
      for (const ch of word) {
        const candidate = chunk + ch;
        if (font.widthOfTextAtSize(candidate, size) > maxWidth && chunk) {
          chunks.push(chunk);
          chunk = ch;
        } else {
          chunk = candidate;
        }
      }
      if (chunk) chunks.push(chunk);
      return chunks;
    };

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
        continue;
      }

      if (current) lines.push(current);

      if (font.widthOfTextAtSize(word, size) > maxWidth) {
        const parts = breakLongWord(word);
        lines.push(...parts.slice(0, -1));
        current = parts[parts.length - 1] ?? "";
      } else {
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [""];
  }

  drawWrapped(
    text: string,
    opts: { x: number; maxWidth: number; size: number; font: PDFFont; color: RGB; lineHeight: number }
  ) {
    const lines = this.wrapText(text, opts.font, opts.size, opts.maxWidth);
    for (const line of lines) {
      this.ensureSpace(opts.lineHeight);
      this.page.drawText(line, { x: opts.x, y: this.y - opts.size, size: opts.size, font: opts.font, color: opts.color });
      this.y -= opts.lineHeight;
    }
    return lines.length * opts.lineHeight;
  }

  drawRule(color: RGB = COLOR.border, thickness = 1) {
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end:   { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness,
      color,
    });
  }
}

// ─── Block renderers ────────────────────────────────────────────────────────

const HEADING_SIZE: Record<1 | 2 | 3, number> = { 1: 20, 2: 15, 3: 12.5 };
const HEADING_SPACE_BEFORE: Record<1 | 2 | 3, number> = { 1: 26, 2: 20, 3: 14 };

function renderHeading(w: PdfWriter, block: Extract<Block, { type: "heading" }>) {
  const size = HEADING_SIZE[block.level] ?? 15;
  w.ensureSpace(HEADING_SPACE_BEFORE[block.level] + size + 8);
  w.y -= HEADING_SPACE_BEFORE[block.level];
  w.drawWrapped(block.text, { x: MARGIN, maxWidth: CONTENT_WIDTH, size, font: w.fonts.bold, color: COLOR.text, lineHeight: size + 4 });
  w.y -= 6;
}

function renderParagraph(w: PdfWriter, block: Extract<Block, { type: "paragraph" }>) {
  w.drawWrapped(block.text, { x: MARGIN, maxWidth: CONTENT_WIDTH, size: 10.5, font: w.fonts.regular, color: COLOR.textSub, lineHeight: 15 });
  w.y -= 8;
}

function renderList(w: PdfWriter, block: Extract<Block, { type: "list" }>) {
  const bulletIndent = 14;
  for (const item of block.items) {
    w.ensureSpace(15);
    w.page.drawText("•", { x: MARGIN, y: w.y - 10.5, size: 10.5, font: w.fonts.bold, color: COLOR.textSub });
    w.drawWrapped(item, {
      x: MARGIN + bulletIndent,
      maxWidth: CONTENT_WIDTH - bulletIndent,
      size: 10.5,
      font: w.fonts.regular,
      color: COLOR.textSub,
      lineHeight: 15,
    });
  }
  w.y -= 4;
}

function renderTable(w: PdfWriter, block: Extract<Block, { type: "table" }>) {
  const cols = block.headers.length;

  // Use the caller's proportional widths if given (percentages, need not sum
  // to exactly 100), otherwise split evenly as before.
  const weights = block.columnWidths?.length === cols ? block.columnWidths : Array(cols).fill(1);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const colWidths = weights.map((wgt) => (wgt / weightSum) * CONTENT_WIDTH);
  const colX = colWidths.reduce<number[]>((acc, cw, i) => [...acc, i === 0 ? MARGIN : acc[i - 1] + colWidths[i - 1]], []);

  const cellPad = cols > 6 ? 5 : 8;
  const size = cols > 6 ? 7.5 : 9;

  const rowHeight = (cells: string[], isHeader: boolean) => {
    let maxLines = 1;
    cells.forEach((cell, i) => {
      const lines = w.wrapText(cell, isHeader ? w.fonts.bold : w.fonts.regular, size, colWidths[i] - cellPad * 2);
      maxLines = Math.max(maxLines, lines.length);
    });
    return maxLines * (size + 3) + cellPad * 2;
  };

  const drawRow = (cells: string[], isHeader: boolean) => {
    const height = rowHeight(cells, isHeader);
    w.ensureSpace(height);
    const top = w.y;

    if (isHeader) {
      w.page.drawRectangle({ x: MARGIN, y: top - height, width: CONTENT_WIDTH, height, color: COLOR.tableHead });
    }

    cells.forEach((cell, i) => {
      const x = colX[i] + cellPad;
      const lines = w.wrapText(cell, isHeader ? w.fonts.bold : w.fonts.regular, size, colWidths[i] - cellPad * 2);
      let ly = top - cellPad - size;
      for (const line of lines) {
        w.page.drawText(line, {
          x, y: ly, size,
          font: isHeader ? w.fonts.bold : w.fonts.regular,
          color: isHeader ? COLOR.tableText : COLOR.cellText,
        });
        ly -= size + 3;
      }
    });

    // column separators + bottom border
    for (let i = 0; i <= cols; i++) {
      const x = i === cols ? MARGIN + CONTENT_WIDTH : colX[i];
      w.page.drawLine({ start: { x, y: top }, end: { x, y: top - height }, thickness: 0.5, color: COLOR.border });
    }
    w.page.drawLine({ start: { x: MARGIN, y: top - height }, end: { x: MARGIN + CONTENT_WIDTH, y: top - height }, thickness: 0.5, color: COLOR.border });

    w.y = top - height;
  };

  w.ensureSpace(rowHeight(block.headers, true));
  drawRow(block.headers, true);
  for (const row of block.rows) drawRow(row, false);
  w.y -= 14;
}

function renderDivider(w: PdfWriter) {
  w.ensureSpace(20);
  w.y -= 8;
  w.drawRule();
  w.y -= 12;
}

function renderNote(w: PdfWriter, block: Extract<Block, { type: "note" }>) {
  const pad = 10;
  const size = 9.5;
  const lines = w.wrapText(`(i)  ${block.text}`, w.fonts.italic, size, CONTENT_WIDTH - pad * 2 - 8);
  const height = lines.length * 13 + pad * 2;

  w.ensureSpace(height + 12);
  w.y -= 8;
  const top = w.y;

  w.page.drawRectangle({ x: MARGIN, y: top - height, width: CONTENT_WIDTH, height, color: COLOR.noteBg });
  w.page.drawRectangle({ x: MARGIN, y: top - height, width: 3, height, color: w.accent });

  let ly = top - pad - size;
  for (const line of lines) {
    w.page.drawText(line, { x: MARGIN + pad + 8, y: ly, size, font: w.fonts.italic, color: COLOR.noteText });
    ly -= 13;
  }

  w.y = top - height - 12;
}

function renderSignature(w: PdfWriter, block: Extract<Block, { type: "signature" }>) {
  w.ensureSpace(70);
  w.y -= 24;
  w.page.drawLine({ start: { x: MARGIN, y: w.y }, end: { x: MARGIN + 220, y: w.y }, thickness: 1, color: COLOR.border });
  w.y -= 16;
  w.drawWrapped(block.label, { x: MARGIN, maxWidth: CONTENT_WIDTH, size: 10, font: w.fonts.regular, color: COLOR.textSub, lineHeight: 14 });
  w.drawWrapped(`Date: ${block.date}`, { x: MARGIN, maxWidth: CONTENT_WIDTH, size: 10, font: w.fonts.regular, color: COLOR.textMuted, lineHeight: 14 });
}

function renderBlock(w: PdfWriter, block: Block) {
  switch (block.type) {
    case "heading":   return renderHeading(w, block);
    case "paragraph": return renderParagraph(w, block);
    case "list":      return renderList(w, block);
    case "table":     return renderTable(w, block);
    case "divider":   return renderDivider(w);
    case "note":      return renderNote(w, block);
    case "signature": return renderSignature(w, block);
    default:          return;
  }
}

// ─── Entry point ────────────────────────────────────────────────────────────

export async function buildDocumentPdf(opts: BuildPdfOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${opts.title} — ${opts.orgName}`);
  doc.setCreator("Regulaton");
  doc.setProducer("Regulaton");

  const accent = hexToRgb(opts.accentColor);
  const w = new PdfWriter(accent, `${opts.orgName} · ${opts.title}`);
  await w.init(doc);

  // Accent bar across the top of the first page
  w.page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH, height: 6, color: accent });

  // Kicker (article ref)
  w.drawWrapped(opts.articleRef.toUpperCase(), {
    x: MARGIN, maxWidth: CONTENT_WIDTH, size: 9, font: w.fonts.bold, color: COLOR.textMuted, lineHeight: 12,
  });
  w.y -= 4;

  // Title
  w.drawWrapped(opts.title, {
    x: MARGIN, maxWidth: CONTENT_WIDTH, size: 22, font: w.fonts.bold, color: COLOR.text, lineHeight: 27,
  });
  w.y -= 4;

  // Org name + generated date
  const metaLine = `${opts.orgName}  ·  ${opts.generatedLabel}`;
  w.drawWrapped(metaLine, {
    x: MARGIN, maxWidth: CONTENT_WIDTH, size: 10, font: w.fonts.regular, color: COLOR.textMuted, lineHeight: 14,
  });
  w.y -= 10;
  w.drawRule();
  w.y -= 20;

  for (const block of opts.blocks) renderBlock(w, block as Block);

  w.drawFooter();

  return doc.save();
}
