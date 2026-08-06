// app/(dashboard)/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { calculateComplianceScore } from "@/lib/compliance/scorer";
import { ComplianceScoreRing } from "@/components/dashboard/ComplianceScoreRing";
import { ObligationCard } from "@/components/dashboard/ObligationCard";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import { DOC_META } from "@/lib/documents";
import { DocumentType } from "@prisma/client";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) redirect("/login");

  const [org, tools, documents, trainingRecords, alerts] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: session.orgId },
      include: { subscription: true },
    }),
    prisma.organizationAITool.findMany({
      where: { organizationId: session.orgId, status: "ACTIVE" },
      include: { libraryTool: true },
    }),
    prisma.complianceDocument.findMany({
      where: { organizationId: session.orgId },
    }),
    prisma.trainingRecord.findMany({
      where: { organizationId: session.orgId },
    }),
    prisma.alert.findMany({
      where: { organizationId: session.orgId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  if (!org) redirect("/onboarding");

  const score = calculateComplianceScore(
    org as any, tools as any, documents, trainingRecords
  );

  const OBLIGATION_CONFIG = [
    { key: "article4Literacy"    as const, title: "AI Literacy",             articleRef: "Article 4 · Required now",        accentColor: DOC_META[DocumentType.LITERACY_TRAINING_RECORD].accentColor, learnMoreId: "ai-literacy" },
    { key: "acceptableUsePolicy" as const, title: "Acceptable Use Policy",   articleRef: "Article 5 · Required now",        accentColor: DOC_META[DocumentType.ACCEPTABLE_USE_POLICY].accentColor,   learnMoreId: "prohibited-practices" },
    { key: "aiSystemRegister"    as const, title: "AI System Register",      articleRef: "Articles 6–7",                     accentColor: DOC_META[DocumentType.AI_SYSTEM_REGISTER].accentColor,      learnMoreId: "high-risk-classification" },
    { key: "humanOversight"      as const, title: "Human Oversight",         articleRef: "Article 14 · High-risk only",     accentColor: DOC_META[DocumentType.OVERSIGHT_PROCEDURE].accentColor,     learnMoreId: "human-oversight" },
    { key: "vendorDueDiligence"  as const, title: "Vendor Due Diligence",    articleRef: "Best practice",                    accentColor: "#F472B6" },
  ];

  const finalizedCount = documents.filter((d) => d.status === "FINALIZED").length;
  const highRiskCount  = tools.filter((t) => t.riskLevel === "HIGH").length;
  const unreadAlerts   = alerts.filter((a) => !a.isRead).length;

  return (
    <div style={{ maxWidth: 900, width: "100%", fontFamily: "Inter, sans-serif" }}>

      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
          letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6,
        }}>
          EU AI Act Compliance
        </div>
        <h1 style={{
          fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 28,
          fontWeight: 600, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em",
        }}>
          {org.name}
        </h1>
      </div>

      {/* Score ring + quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr]" style={{ gap: 20, marginBottom: 28 }}>
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14,
          padding: "24px 28px", display: "flex", flexDirection: "row",
          alignItems: "center", gap: 20, minWidth: 0,
        }}>
          <ComplianceScoreRing score={score.overallScore} size={110} />
          <div style={{
            fontFamily: "IBM Plex Mono, monospace", fontSize: 10,
            color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            Overall<br />score
          </div>
        </div>

        <div className="grid grid-cols-2" style={{ gap: 12 }}>
          {[
            {
              value: tools.length,
              label: "AI tools registered",
              sub: highRiskCount > 0 ? `${highRiskCount} high-risk` : "No high-risk tools",
              href: "/inventory",
              accent: highRiskCount > 0 ? "#DC2626" : "#059669",
            },
            {
              value: `${finalizedCount}/${documents.length}`,
              label: "Documents finalised",
              sub: documents.length === 0 ? "None generated" : `${documents.length - finalizedCount} still draft`,
              href: "/documents",
              accent: finalizedCount === documents.length && documents.length > 0 ? "#059669" : "#D97706",
            },
            {
              value: trainingRecords.length,
              label: "Staff training records",
              sub: trainingRecords.length === 0 ? "None added yet" : "on file",
              href: "/training",
              accent: trainingRecords.length === 0 ? "#D97706" : "#059669",
            },
            {
              value: unreadAlerts,
              label: "Unread alerts",
              sub: unreadAlerts === 0 ? "All clear" : "need attention",
              href: "#alerts",
              accent: unreadAlerts > 0 ? "#DC2626" : "#059669",
            },
          ].map((stat) => (
            <Link key={stat.label} href={stat.href} className="card-hover" style={{
              textDecoration: "none", background: "var(--bg-card)",
              border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px",
              display: "flex", flexDirection: "column", gap: 4,
            }}>
              <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 28, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1 }}>
                {stat.value}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{stat.label}</span>
              <span style={{ fontSize: 12, color: stat.accent }}>{stat.sub}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Obligations */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 18,
          fontWeight: 600, color: "var(--text-primary)", marginBottom: 14, letterSpacing: "-0.01em",
        }}>
          Compliance obligations
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {OBLIGATION_CONFIG.map(({ key, title, articleRef, accentColor, learnMoreId }) => {
            const ob = score[key];
            return (
              <ObligationCard
                key={key}
                title={title}
                articleRef={articleRef}
                status={ob.status}
                message={ob.message}
                actionLabel={ob.actionLabel}
                actionUrl={ob.actionUrl}
                accentColor={accentColor}
                learnMoreId={learnMoreId}
              />
            );
          })}
        </div>
      </div>

      {/* Alerts — client component handles mark-as-read */}
      <div id="alerts">
        <AlertFeed alerts={alerts as any} />
      </div>
    </div>
  );
}
