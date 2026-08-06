// components/dashboard/ObligationCard.tsx
import Link from "next/link";

type Status = "COMPLIANT" | "PARTIAL" | "NON_COMPLIANT" | "NOT_APPLICABLE";

const STATUS_CONFIG: Record<Status, {
  dot: string;
  label: string;
  labelColour: string;
  bg: string;
  border: string;
}> = {
  COMPLIANT: {
    dot: "var(--success)",
    label: "Compliant",
    labelColour: "var(--success)",
    bg: "var(--success-bg)",
    border: "var(--success-border)",
  },
  PARTIAL: {
    dot: "var(--warning)",
    label: "Partial",
    labelColour: "var(--warning)",
    bg: "var(--warning-bg)",
    border: "var(--warning-border)",
  },
  NON_COMPLIANT: {
    dot: "var(--danger)",
    label: "Action needed",
    labelColour: "var(--danger)",
    bg: "var(--danger-bg)",
    border: "var(--danger-border)",
  },
  NOT_APPLICABLE: {
    dot: "var(--text-muted)",
    label: "Not applicable",
    labelColour: "var(--text-muted)",
    bg: "var(--bg-subtle)",
    border: "var(--border)",
  },
};

interface ObligationCardProps {
  title: string;
  articleRef: string;   // e.g. "Article 4"
  status: Status;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
  accentColor?: string; // left border accent, matches the obligation's document type colour
  learnMoreId?: string; // id of the matching entry in the AI Act Guide (/learn)
}

export function ObligationCard({
  title, articleRef, status, message, actionLabel, actionUrl, accentColor, learnMoreId,
}: ObligationCardProps) {
  const cfg = STATUS_CONFIG[status];

  return (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderLeft: `4px solid ${accentColor ?? cfg.border}`,
      borderRadius: 10,
      padding: "16px 18px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          {/* Article ref */}
          <div style={{
            fontFamily: "IBM Plex Mono, monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            marginBottom: 4,
          }}>
            {articleRef}
          </div>

          {/* Title */}
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 6,
          }}>
            {title}
          </div>

          {/* Message */}
          <p style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            lineHeight: 1.55,
            margin: 0,
          }}>
            {message}
          </p>

          {/* CTA */}
          <div className="flex flex-wrap" style={{ gap: 10, marginTop: 10, alignItems: "center" }}>
            {actionLabel && actionUrl && status !== "COMPLIANT" && status !== "NOT_APPLICABLE" && (
              <Link
                href={actionUrl}
                className="btn-ghost"
                style={{
                  display: "inline-block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  textDecoration: "none",
                  padding: "5px 12px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: 6,
                }}
              >
                {actionLabel} →
              </Link>
            )}
            {learnMoreId && (
              <Link
                href={`/learn#${learnMoreId}`}
                className="link-hover"
                style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)", textDecoration: "none" }}
              >
                What does {articleRef.split(" ·")[0]} require? →
              </Link>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          flexShrink: 0,
          padding: "4px 10px",
          borderRadius: 20,
          background: "var(--bg-card)",
          border: `1px solid ${cfg.border}`,
        }}>
          <div style={{
            width: 6, height: 6,
            borderRadius: "50%",
            background: cfg.dot,
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: "IBM Plex Mono, monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.04em",
            color: cfg.labelColour,
            whiteSpace: "nowrap",
          }}>
            {cfg.label.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
