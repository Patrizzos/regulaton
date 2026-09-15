"use client";
// components/settings/TeamSection.tsx
// Shows team members. Regulaton is designed around one shared login per
// organisation rather than open self-serve invites — an "anyone with this
// link can join" mechanism was removed in favour of that. If you need to
// add a specific person, share your login credentials directly with them.

import { PLANS, PlanKey } from "@/lib/plans";

interface Member {
  id: string;
  role: string;
  joinedAt: Date;
  user: { name: string | null; email: string | null; image: string | null };
}

interface Props {
  members: Member[];
  isOwner: boolean;
  plan: PlanKey;
}

// Only OWNER exists as a role now (see MemberRole in schema.prisma) — kept
// as a lookup rather than hardcoding the label inline in case a future
// multi-user feature reintroduces other roles.
const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
};

export function TeamSection({ members, isOwner, plan }: Props) {
  const planConfig = PLANS[plan];
  const overSeatBand = members.length > planConfig.maxSeats;
  const nextPlan = planConfig.nextPlan ? PLANS[planConfig.nextPlan] : null;

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
      <div>
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

      {isOwner && (
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "16px 0 0", lineHeight: 1.6 }}>
          Regulaton is designed for a single shared login per organisation. To give a colleague access, share your account credentials directly rather than through an open invite link.
        </p>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  card:      { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 16 },
  cardTitle: { fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" },
  cardSub:   { fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px" },
};
