"use client";
// components/settings/TeamSection.tsx
// Shows team members and a shareable invite link.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLANS, PlanKey } from "@/lib/plans";

interface Member {
  id: string;
  role: string;
  joinedAt: Date;
  user: { name: string | null; email: string | null; image: string | null };
}

interface Props {
  members: Member[];
  inviteToken: string | null;
  isOwner: boolean;
  plan: PlanKey;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member",
};

export function TeamSection({ members, inviteToken: initial, isOwner, plan }: Props) {
  const router = useRouter();
  const [token, setToken]       = useState(initial);
  const [loading, setLoading]   = useState(false);
  const [copied, setCopied]     = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = token ? `${appUrl}/invite/${token}` : null;

  const planConfig = PLANS[plan];
  const overSeatBand = members.length > planConfig.maxSeats;
  const nextPlan = planConfig.nextPlan ? PLANS[planConfig.nextPlan] : null;

  async function generateLink() {
    setLoading(true);
    try {
      const res  = await fetch("/api/org/invite", { method: "POST" });
      const data = await res.json();
      setToken(data.inviteToken);
    } finally {
      setLoading(false);
    }
  }

  async function revokeLink() {
    if (!confirm("Revoke this invite link? Anyone who hasn't joined yet won't be able to use it.")) return;
    setLoading(true);
    try {
      await fetch("/api/org/invite", { method: "DELETE" });
      setToken(null);
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="px-4 py-5 sm:px-7 sm:py-6" style={S.card}>
      <h2 style={S.cardTitle}>Team</h2>
      <p style={S.cardSub}>
        {members.length} member{members.length === 1 ? "" : "s"} in your organisation.
      </p>

      {overSeatBand && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "12px 14px", marginBottom: 20, borderRadius: 8,
          background: "var(--warning-bg)", border: "1px solid var(--warning-border)",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--warning)" }}>
              You've outgrown the {planConfig.label} plan
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "4px 0 0", lineHeight: 1.5 }}>
              {planConfig.label} covers {planConfig.employees.toLowerCase()}, and you've got {members.length} people here.
              {nextPlan
                ? ` ${nextPlan.label} (${nextPlan.price}) covers ${nextPlan.employees.toLowerCase()}.`
                : " Reach out and we'll sort out pricing that fits your team."}
            </p>
          </div>
          {isOwner && nextPlan && (
            <a
              href="/settings#billing"
              className="link-hover"
              style={{
                flexShrink: 0, fontSize: 12.5, fontWeight: 600, color: "var(--warning)",
                textDecoration: "none", whiteSpace: "nowrap", marginTop: 1,
              }}
            >
              Upgrade →
            </a>
          )}
        </div>
      )}

      {/* Members list */}
      <div style={{ marginBottom: 24 }}>
        {members.map((m) => (
          <div key={m.id} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 0",
            borderBottom: "1px solid var(--border)",
          }}>
            {/* Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "var(--bg-subtle)", overflow: "hidden", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 600, color: "var(--text-secondary)",
            }}>
              {m.user.image
                ? <img src={m.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (m.user.name?.[0] ?? m.user.email?.[0] ?? "?").toUpperCase()
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                {m.user.name ?? m.user.email ?? "Unknown"}
              </div>
              {m.user.name && (
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.user.email}</div>
              )}
            </div>
            <span style={{
              fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 20,
              fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em",
              background: m.role === "OWNER" ? "var(--info-bg)" : "var(--bg-subtle)",
              color: m.role === "OWNER" ? "var(--info)" : "var(--text-secondary)",
            }}>
              {ROLE_LABELS[m.role] ?? m.role}
            </span>
          </div>
        ))}
      </div>

      {/* Invite link — owners/admins only */}
      {isOwner && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
            Invite link
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 12px", lineHeight: 1.5 }}>
            Anyone with this link can join your organisation as a member. Revoke and regenerate if you want to stop sharing access.
          </p>

          {inviteUrl ? (
            <div className="flex flex-col sm:flex-row sm:items-center" style={{ gap: 8 }}>
              <div style={{
                flex: 1, padding: "8px 12px", background: "var(--bg-subtle)",
                border: "1px solid var(--border)", borderRadius: 7,
                fontSize: 12, color: "var(--text-secondary)", fontFamily: "IBM Plex Mono, monospace",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {inviteUrl}
              </div>
              <div className="flex" style={{ gap: 8 }}>
                <button onClick={copyLink} className={copied ? "" : "btn-dark"} style={{
                  padding: "8px 14px", background: copied ? "var(--success)" : "var(--btn-primary-bg)",
                  color: copied ? "#0B0E14" : "var(--btn-primary-text)", border: "none", borderRadius: 7, fontSize: 12,
                  fontWeight: 600, cursor: "pointer", flexShrink: 0, fontFamily: "Inter, sans-serif",
                }}>
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button onClick={revokeLink} disabled={loading} className={loading ? "" : "btn-danger-ghost"} style={{
                  padding: "8px 14px", background: "var(--bg-card)", color: "var(--danger)",
                  border: "1.5px solid var(--danger-border)", borderRadius: 7, fontSize: 12,
                  fontWeight: 500, cursor: "pointer", flexShrink: 0, fontFamily: "Inter, sans-serif",
                }}>
                  Revoke
                </button>
              </div>
            </div>
          ) : (
            <button onClick={generateLink} disabled={loading} className={loading ? "" : "btn-outline-dark"} style={{
              padding: "9px 18px", background: "var(--bg-card)", color: "var(--text-primary)",
              border: "1.5px solid var(--border)", borderRadius: 7, fontSize: 13,
              fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>
              {loading ? "Generating…" : "Generate invite link"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  card:      { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 16 },
  cardTitle: { fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" },
  cardSub:   { fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px" },
};
