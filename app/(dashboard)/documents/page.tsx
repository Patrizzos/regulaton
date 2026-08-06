// app/(dashboard)/documents/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DocumentType, DocumentStatus } from "@prisma/client";
import { DOC_META, SLUG_FROM_TYPE, STATUS_LABELS, STATUS_COLORS, staleReasonMessage } from "@/lib/documents";
import { RegenerateButton } from "@/components/documents/RegenerateButton";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

const ALL_TYPES = [
  DocumentType.ACCEPTABLE_USE_POLICY,
  DocumentType.AI_SYSTEM_REGISTER,
  DocumentType.LITERACY_TRAINING_RECORD,
  DocumentType.OVERSIGHT_PROCEDURE,
];

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) redirect("/login");

  const documents = await prisma.complianceDocument.findMany({
    where: { organizationId: session.orgId },
  });

  const docMap = Object.fromEntries(documents.map((d) => [d.type, d]));

  return (
    <div style={{ maxWidth: 800, width: "100%", fontFamily: "Inter, sans-serif" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
          letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6,
        }}>
          EU AI Act Compliance
        </div>
        <h1 style={{
          fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 28,
          fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px", letterSpacing: "-0.02em",
        }}>
          Compliance Documents
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
          Review each document, make any edits, then finalise and download.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ALL_TYPES.map((type) => {
          const meta   = DOC_META[type];
          const doc    = docMap[type];
          const status = doc?.status ?? null;
          const slug   = SLUG_FROM_TYPE[type];
          const colors = status ? STATUS_COLORS[status] : STATUS_COLORS[DocumentStatus.DRAFT];
          const label  = status ? STATUS_LABELS[status] : "Not generated";
          const needsUpdate = status === DocumentStatus.NEEDS_UPDATE;

          return (
            <div key={type} className="card-hover" style={{
              background: "var(--bg-card)",
              border: "1px solid",
              borderColor: needsUpdate ? "var(--warning-border)" : "var(--border)",
              borderRadius: 12,
              padding: "20px 24px",
              borderLeft: `4px solid ${meta.accentColor}`,
            }}>
              <div className="flex flex-col sm:flex-row sm:items-center" style={{ gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "IBM Plex Mono, monospace", fontSize: 10,
                    color: "var(--text-muted)", letterSpacing: "0.08em",
                    textTransform: "uppercase", marginBottom: 4,
                  }}>
                    {meta.articleRef}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                    {meta.title}
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 10px", lineHeight: 1.5 }}>
                    {meta.description}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, fontFamily: "IBM Plex Mono, monospace",
                      letterSpacing: "0.04em", padding: "3px 10px", borderRadius: 20,
                      background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                    }}>
                      {label.toUpperCase()}
                    </span>
                    {doc?.generatedAt && (
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        Generated {formatDistanceToNow(new Date(doc.generatedAt), { addSuffix: true })}
                      </span>
                    )}
                    {doc?.finalizedAt && (
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        · Finalised {formatDistanceToNow(new Date(doc.finalizedAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>

                  {/* Needs update explanation */}
                  {needsUpdate && (
                    <div style={{
                      marginTop: 10, fontSize: 12, color: "var(--warning)",
                      background: "var(--warning-bg)", border: "1px solid var(--warning-border)",
                      borderRadius: 6, padding: "6px 10px",
                    }}>
                      {staleReasonMessage(doc?.staleReason)}
                    </div>
                  )}
                </div>

                <div className="flex flex-row sm:flex-col" style={{ gap: 8, flexShrink: 0 }}>
                  {doc ? (
                    <>
                      {needsUpdate ? (
                        <RegenerateButton docType={slug} />
                      ) : (
                        <Link
                          href={`/documents/${slug}`}
                          className="flex-1 sm:flex-none btn-dark"
                          style={{
                            padding: "8px 18px", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)",
                            borderRadius: 7, fontSize: 13, fontWeight: 600,
                            textDecoration: "none", textAlign: "center",
                          }}
                        >
                          View →
                        </Link>
                      )}
                      <div className="flex flex-row" style={{ gap: 8 }}>
                        <a
                          href={`/api/documents/${slug}/export`}
                          className="flex-1 sm:flex-none btn-outline-dark"
                          style={{
                            padding: "8px 14px", background: "var(--bg-card)", color: "var(--text-primary)",
                            border: "1px solid var(--border)", borderRadius: 7, fontSize: 13,
                            fontWeight: 500, textDecoration: "none", textAlign: "center", whiteSpace: "nowrap",
                          }}
                        >
                          ↓ .docx
                        </a>
                        <a
                          href={`/api/documents/${slug}/export-pdf`}
                          className="flex-1 sm:flex-none btn-outline-dark"
                          style={{
                            padding: "8px 14px", background: "var(--bg-card)", color: "var(--text-primary)",
                            border: "1px solid var(--border)", borderRadius: 7, fontSize: 13,
                            fontWeight: 500, textDecoration: "none", textAlign: "center", whiteSpace: "nowrap",
                          }}
                        >
                          ↓ .pdf
                        </a>
                      </div>
                    </>
                  ) : (
                    <span style={{
                      padding: "8px 18px", background: "var(--bg-subtle)", color: "var(--text-muted)",
                      border: "1px solid var(--border)", borderRadius: 7, fontSize: 13, textAlign: "center",
                    }}>
                      Not generated
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 24, padding: "14px 18px", background: "var(--info-bg)",
        border: "1px solid var(--info-border)", borderRadius: 10, fontSize: 13,
        color: "var(--info)", lineHeight: 1.6,
      }}>
        <strong>How to finalise:</strong> Open each document, review the content, then click{" "}
        <strong>Mark as finalised</strong>. Finalised documents count toward your compliance score.
      </div>
    </div>
  );
}
