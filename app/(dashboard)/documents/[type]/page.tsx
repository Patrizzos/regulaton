// app/(dashboard)/documents/[type]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { DocumentStatus } from "@prisma/client";
import { BlockRenderer } from "@/components/documents/BlockRenderer";
import { TYPE_FROM_SLUG, DOC_META, STATUS_LABELS, STATUS_COLORS, staleReasonMessage, staleReasonTitle } from "@/lib/documents";
import { ACT_ARTICLES } from "@/lib/act-articles";
import { FinaliseButton } from "@/components/documents/FinaliseButton";
import { RegenerateButton } from "@/components/documents/RegenerateButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DocumentViewerPage({ params }: { params: { type: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) redirect("/login");

  const docType = TYPE_FROM_SLUG[params.type];
  if (!docType) notFound();

  const doc = await prisma.complianceDocument.findUnique({
    where: { organizationId_type: { organizationId: session.orgId, type: docType } },
  });

  if (!doc) notFound();

  const meta    = DOC_META[docType];
  const colors  = STATUS_COLORS[doc.status];
  const label   = STATUS_LABELS[doc.status];
  const blocks  = (doc.content as any)?.blocks ?? [];
  const needsUpdate  = doc.status === DocumentStatus.NEEDS_UPDATE;
  const isDraft      = doc.status === DocumentStatus.DRAFT;
  const isFinalized  = doc.status === DocumentStatus.FINALIZED;
  const relatedArticle = ACT_ARTICLES.find((a) => a.relatedDocSlug === params.type);

  return (
    <div style={{ maxWidth: 860, width: "100%", fontFamily: "Inter, sans-serif" }}>

      <Link href="/documents" className="link-hover" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)", textDecoration: "none", marginBottom: 24 }}>
        ← All documents
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px", marginBottom: 24, gap: 16, borderLeft: `4px solid ${meta.accentColor}` }}>
        <div>
          <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{meta.articleRef}</div>
          <h1 style={{ fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 22, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px" }}>{meta.title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em", padding: "3px 10px", borderRadius: 20, background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
              {label.toUpperCase()}
            </span>
            {relatedArticle && (
              <Link href={`/learn#${relatedArticle.id}`} className="link-hover" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>
                What does {relatedArticle.number} require? →
              </Link>
            )}
          </div>
        </div>
        <div className="flex flex-wrap" style={{ gap: 10, flexShrink: 0 }}>
          {needsUpdate && <RegenerateButton docType={params.type} />}
          {isDraft     && <FinaliseButton   docType={params.type} />}
          <a href={`/api/documents/${params.type}/export`} className="btn-outline-dark" style={{ padding: "9px 18px", background: "var(--bg-card)", color: "var(--text-primary)", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
            ↓ Download .docx
          </a>
          <a href={`/api/documents/${params.type}/export-pdf`} className="btn-outline-dark" style={{ padding: "9px 18px", background: "var(--bg-card)", color: "var(--text-primary)", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
            ↓ Download .pdf
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-8 sm:px-12 sm:py-10" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12 }}>
        {blocks.length > 0
          ? <BlockRenderer blocks={blocks} />
          : <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No content found. Regenerate this document from the documents list.</p>
        }
      </div>

      {/* Status nudges */}
      {needsUpdate && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ marginTop: 20, padding: "14px 20px", background: "var(--warning-bg)", border: "1px solid var(--warning-border)", borderRadius: 10, gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--warning)", marginBottom: 2 }}>{staleReasonTitle(doc.staleReason)}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{staleReasonMessage(doc.staleReason)}</div>
          </div>
          <RegenerateButton docType={params.type} />
        </div>
      )}
      {isDraft && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ marginTop: 20, padding: "14px 20px", background: "var(--warning-bg)", border: "1px solid var(--warning-border)", borderRadius: 10, gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--warning)", marginBottom: 2 }}>This document is a draft</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Review the content above, then mark it as finalised.</div>
          </div>
          <FinaliseButton docType={params.type} />
        </div>
      )}
    </div>
  );
}
