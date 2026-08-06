// app/(dashboard)/inventory/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ToolCard } from "@/components/inventory/ToolCard";
import { AddToolButton } from "@/components/inventory/AddToolButton";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) redirect("/login");

  const tools = await prisma.organizationAITool.findMany({
    where: { organizationId: session.orgId },
    include: { libraryTool: true },
    orderBy: [{ riskLevel: "asc" }, { addedAt: "asc" }],
  });

  const active   = tools.filter((t) => t.status === "ACTIVE");
  const inactive = tools.filter((t) => t.status !== "ACTIVE");
  const highRisk = active.filter((t) => t.riskLevel === "HIGH");

  // Profile completeness stats
  const complete   = active.filter((t) => t.department && t.usageDescription && t.accountablePerson);
  const incomplete = active.length - complete.length;
  const vendorDone = active.filter((t) => t.vendorCompliance !== null);

  return (
    <div style={{ maxWidth: 860, width: "100%", fontFamily: "Inter, sans-serif" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between" style={{ marginBottom: 28, gap: 16 }}>
        <div>
          <div style={{
            fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
            letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6,
          }}>
            AI System Register
          </div>
          <h1 style={{
            fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 28,
            fontWeight: 600, color: "var(--text-primary)", margin: "0 0 6px", letterSpacing: "-0.02em",
          }}>
            AI Tool Inventory
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
            {active.length} active tool{active.length === 1 ? "" : "s"} ·{" "}
            {incomplete > 0
              ? `${incomplete} with incomplete profiles`
              : "All profiles complete"}
          </p>
        </div>
        <AddToolButton />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12, marginBottom: 28 }}>
        {[
          {
            val: `${complete.length}/${active.length}`,
            label: "Profiles complete",
            sub: incomplete > 0 ? `${incomplete} need details` : "All done ✓",
            colour: incomplete > 0 ? "var(--warning)" : "var(--success)",
          },
          {
            val: `${vendorDone.length}/${active.length}`,
            label: "Vendors checked",
            sub: vendorDone.length < active.length ? "Mark unchecked vendors" : "All checked ✓",
            colour: vendorDone.length < active.length ? "var(--warning)" : "var(--success)",
          },
          {
            val: highRisk.length,
            label: "High-risk tools",
            sub: highRisk.length === 0 ? "None, no Annex III obligations" : "Oversight procedures required",
            colour: highRisk.length > 0 ? "var(--danger)" : "var(--success)",
          },
        ].map((s) => (
          <div key={s.label} style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "14px 18px",
          }}>
            <div style={{
              fontFamily: "IBM Plex Mono, monospace", fontSize: 24,
              fontWeight: 500, color: "var(--text-primary)", marginBottom: 4,
            }}>
              {s.val}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: s.colour }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* High-risk warning */}
      {highRisk.length > 0 && (
        <div style={{
          padding: "12px 16px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)",
          borderRadius: 10, fontSize: 13, color: "var(--danger)", marginBottom: 20,
          lineHeight: 1.6,
        }}>
          <strong>⚠ {highRisk.length} high-risk tool{highRisk.length > 1 ? "s" : ""} detected.</strong>{" "}
          Expand each one below to add human oversight procedures, required under Annex III of the EU AI Act.
        </div>
      )}

      {/* Active tools */}
      {active.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {active.map((tool) => (
            <ToolCard key={tool.id} tool={tool as any} />
          ))}
        </div>
      ) : (
        <div className="card-hover" style={{
          background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12,
          padding: "48px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔧</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
            No tools in inventory
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px" }}>
            Add the AI tools your organisation uses to build your AI system register.
          </p>
          <AddToolButton />
        </div>
      )}

      {/* Inactive tools */}
      {inactive.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{
            fontSize: 11, fontFamily: "IBM Plex Mono, monospace",
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: "var(--text-muted)", marginBottom: 12,
          }}>
            Inactive / removed ({inactive.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {inactive.map((tool) => (
              <div key={tool.id} style={{
                padding: "10px 16px", background: "var(--bg-subtle)",
                border: "1px solid var(--border)", borderRadius: 8,
                fontSize: 13, color: "var(--text-muted)",
                display: "flex", justifyContent: "space-between",
              }}>
                <span>{tool.libraryTool?.name ?? tool.customName}</span>
                <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10 }}>INACTIVE</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
