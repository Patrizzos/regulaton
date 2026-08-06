// app/(dashboard)/training/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AddTrainingRecord } from "@/components/training/AddTrainingRecord";
import { EditTrainingRecord } from "@/components/training/EditTrainingRecord";
import { DeleteTrainingRecord } from "@/components/training/DeleteTrainingRecord";
import { TrainingProgress } from "@/components/training/TrainingProgress";
import { format } from "date-fns";
import { TRAINING_TYPE_LABELS } from "@/lib/training-labels";

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) redirect("/login");

  const [org, records] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: session.orgId },
      select: { trainingTarget: true },
    }),
    prisma.trainingRecord.findMany({
      where: { organizationId: session.orgId },
      orderBy: { completedAt: "desc" },
    }),
  ]);

  return (
    <div style={{ maxWidth: 800, width: "100%", fontFamily: "Inter, sans-serif" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between" style={{ marginBottom: 24, gap: 16 }}>
        <div>
          <div style={{
            fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
            letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6,
          }}>
            Article 4 · EU AI Act
          </div>
          <h1 style={{
            fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 28,
            fontWeight: 600, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em",
          }}>
            Staff Training Records
          </h1>
        </div>
        <AddTrainingRecord />
      </div>

      {/* Progress tracker */}
      <TrainingProgress
        trained={new Set(records.map((r) => r.staffEmail)).size}
        target={org?.trainingTarget ?? null}
      />

      {/* Article 4 info box */}
      <div style={{
        padding: "14px 18px", background: "var(--info-bg)", border: "1px solid var(--info-border)",
        borderRadius: 10, fontSize: 13, color: "var(--info)", lineHeight: 1.6, marginBottom: 24,
      }}>
        <strong>Article 4 requires:</strong> All staff who use AI tools must have documented AI literacy training.
        Add a record for each team member. A record of your internal policy walkthrough counts.
        This is already in force and required <strong>now</strong>.
      </div>

      {/* Records table */}
      {records.length > 0 ? (
        <div className="overflow-x-auto" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12 }}>
          <table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                {["Staff member", "Training type", "Completed", "Evidence", "", ""].map((h, idx) => (
                  <th key={`${h}-${idx}`} style={{
                    padding: "11px 16px", textAlign: "left", fontWeight: 600,
                    color: "var(--text-secondary)", fontFamily: "IBM Plex Mono, monospace",
                    fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase",
                    background: "var(--bg-subtle)",
                    ...(h === "Training type" ? { maxWidth: 170 } : {}),
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((record, i) => (
                <tr
                  key={record.id}
                  style={{ borderBottom: i < records.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{record.staffName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{record.staffEmail}</div>
                  </td>
                  <td style={{ padding: "13px 16px", color: "var(--text-secondary)", maxWidth: 170, whiteSpace: "normal", wordBreak: "break-word" }}>
                    {TRAINING_TYPE_LABELS[record.trainingType] ?? record.trainingType}
                  </td>
                  <td style={{ padding: "13px 16px", color: "var(--text-secondary)", fontFamily: "IBM Plex Mono, monospace", fontSize: 12 }}>
                    {format(new Date(record.completedAt), "d MMM yyyy")}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    {record.evidenceUrl ? (
                      <a href={record.evidenceUrl} target="_blank" rel="noopener noreferrer"
                        className="link-hover"
                        style={{ fontSize: 12, color: "var(--info)", textDecoration: "none" }}>
                        View ↗
                      </a>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "13px 16px", textAlign: "right" }}>
                    <EditTrainingRecord record={record} />
                  </td>
                  <td style={{ padding: "13px 16px", textAlign: "right" }}>
                    <DeleteTrainingRecord id={record.id} name={record.staffName} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12,
          padding: "48px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
            No training records yet
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px" }}>
            Add a record for each staff member who uses AI tools.
          </p>
          <AddTrainingRecord />
        </div>
      )}
    </div>
  );
}
