"use client";
// components/inventory/ToolCard.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Tool {
  id: string;
  riskLevel: string;
  category: string;
  department: string | null;
  usageDescription: string | null;
  accountablePerson: string | null;
  accountableEmail: string | null;
  oversightProcedure: string | null;
  vendorCompliance: boolean | null;
  status: string;
  libraryTool: { name: string; providerCompany: string } | null;
  customName: string | null;
  customProvider: string | null;
}

const RISK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  MINIMAL:      { bg: "var(--success-bg)", text: "var(--success)", border: "var(--success-border)" },
  LIMITED:      { bg: "var(--warning-bg)", text: "var(--warning)", border: "var(--warning-border)" },
  HIGH:         { bg: "var(--danger-bg)",  text: "var(--danger)",  border: "var(--danger-border)" },
  UNACCEPTABLE: { bg: "var(--purple-bg)",  text: "var(--purple)",  border: "var(--purple-border)" },
};

const RISK_LABELS: Record<string, string> = {
  MINIMAL: "Minimal", LIMITED: "Limited", HIGH: "High risk", UNACCEPTABLE: "Prohibited",
};

// Profile is complete when all base fields are filled.
// For HIGH risk tools, oversightProcedure is also required.
function isProfileComplete(fields: {
  department: string;
  usageDescription: string;
  accountablePerson: string;
  oversightProcedure: string;
}, isHigh: boolean): boolean {
  const base = !!(fields.department && fields.usageDescription && fields.accountablePerson);
  if (!isHigh) return base;
  return base && !!fields.oversightProcedure.trim();
}

function profileLabel(fields: {
  department: string;
  usageDescription: string;
  accountablePerson: string;
  oversightProcedure: string;
}, isHigh: boolean): string {
  const hasBase = !!(fields.department && fields.usageDescription && fields.accountablePerson);
  if (!hasBase) return "Profile incomplete";
  if (isHigh && !fields.oversightProcedure.trim()) return "Needs oversight procedure";
  return "✓ Profile";
}

export function ToolCard({ tool }: { tool: Tool }) {
  const router = useRouter();
  const [expanded, setExpanded]  = useState(false);
  const [saving, setSaving]      = useState(false);
  const [removing, setRemoving]  = useState(false);
  const [fields, setFields]      = useState({
    department:         tool.department ?? "",
    usageDescription:   tool.usageDescription ?? "",
    accountablePerson:  tool.accountablePerson ?? "",
    accountableEmail:   tool.accountableEmail ?? "",
    oversightProcedure: tool.oversightProcedure ?? "",
    vendorCompliance:   tool.vendorCompliance,
  });

  const name         = tool.libraryTool?.name ?? tool.customName ?? "Unknown";
  const provider     = tool.libraryTool?.providerCompany ?? tool.customProvider ?? "";
  const risk         = RISK_COLORS[tool.riskLevel] ?? RISK_COLORS.MINIMAL;
  const isHigh       = tool.riskLevel === "HIGH";
  const complete     = isProfileComplete(fields, isHigh);
  const vendorChecked = fields.vendorCompliance !== null;

  // Profile badge colour
  const profileColour = complete
    ? { bg: "var(--success-bg)", text: "var(--success)", border: "var(--success-border)" }
    : isHigh && fields.department && fields.usageDescription && fields.accountablePerson && !fields.oversightProcedure.trim()
    ? { bg: "var(--danger-bg)", text: "var(--danger)", border: "var(--danger-border)" } // red — oversight specifically missing
    : { bg: "var(--warning-bg)", text: "var(--warning)", border: "var(--warning-border)" }; // amber — base fields missing

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/tools/${tool.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      setExpanded(false);
      router.refresh();
    } catch {
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleVendorToggle(value: boolean) {
    setFields((f) => ({ ...f, vendorCompliance: value }));
    await fetch(`/api/tools/${tool.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorCompliance: value }),
    });
    router.refresh();
  }

  async function handleRemove() {
    if (!confirm(`Remove ${name} from your inventory?`)) return;
    setRemoving(true);
    try {
      await fetch(`/api/tools/${tool.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid",
      borderColor: isHigh ? "var(--danger-border)" : "var(--border)",
      borderRadius: 10,
      overflow: "hidden",
    }}>
      {/* Header row */}
      <div className="flex flex-wrap" style={{
        alignItems: "center", gap: 10,
        padding: "14px 18px",
        background: isHigh ? "var(--danger-bg)" : "var(--bg-card)",
      }}>
        {/* Risk badge */}
        <span style={{
          flexShrink: 0, fontSize: 10, fontWeight: 600,
          fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em",
          padding: "3px 9px", borderRadius: 5,
          background: risk.bg, color: risk.text, border: `1px solid ${risk.border}`,
        }}>
          {RISK_LABELS[tool.riskLevel]}
        </span>

        {/* Name */}
        <div style={{ flex: "1 1 140px", minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{name}</span>
          {provider && (
            <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>{provider}</span>
          )}
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap" style={{ gap: 6, alignItems: "center" }}>
          <span style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 500,
            fontFamily: "IBM Plex Mono, monospace",
            background: profileColour.bg, color: profileColour.text, border: `1px solid ${profileColour.border}`,
          }}>
            {profileLabel(fields, isHigh)}
          </span>

          <span style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 500,
            fontFamily: "IBM Plex Mono, monospace",
            background: vendorChecked ? "var(--success-bg)" : "var(--bg-subtle)",
            color: vendorChecked ? "var(--success)" : "var(--text-muted)",
            border: `1px solid ${vendorChecked ? "var(--success-border)" : "var(--border)"}`,
          }}>
            {vendorChecked
              ? (fields.vendorCompliance ? "✓ Vendor" : "✗ Vendor")
              : "Vendor unchecked"}
          </span>
        </div>

        {/* Edit / remove */}
        <div className="flex" style={{ gap: 8, marginLeft: "auto" }}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="btn-ghost"
            style={{
              padding: "6px 14px", fontSize: 12, fontWeight: 500,
              background: expanded ? "var(--bg-subtle)" : "var(--bg-card)",
              border: "1.5px solid var(--border)", borderRadius: 6,
              cursor: "pointer", fontFamily: "Inter, sans-serif", color: "var(--text-secondary)",
            }}
          >
            {expanded ? "Close" : "Edit"}
          </button>
          <button
            onClick={handleRemove}
            disabled={removing}
            aria-label={`Remove ${name} from inventory`}
            className={removing ? "" : "btn-danger-ghost"}
            style={{
              padding: "6px 10px", fontSize: 12,
              background: "none", border: "none",
              cursor: "pointer", color: "var(--text-muted)",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {removing ? "…" : "✕"}
          </button>
        </div>
      </div>

      {/* Edit panel */}
      {expanded && (
        <div style={{ padding: "20px 18px", borderTop: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
            <div style={ES.field}>
              <label style={ES.label}>Department / team</label>
              <input style={ES.input} placeholder="e.g. Marketing, HR, Engineering"
                value={fields.department}
                onChange={(e) => setFields((f) => ({ ...f, department: e.target.value }))} />
            </div>
            <div style={ES.field}>
              <label style={ES.label}>Accountable person</label>
              <input style={ES.input} placeholder="Full name"
                value={fields.accountablePerson}
                onChange={(e) => setFields((f) => ({ ...f, accountablePerson: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
            <div style={ES.field}>
              <label style={ES.label}>Accountable email</label>
              <input style={ES.input} type="email" placeholder="name@company.com"
                value={fields.accountableEmail}
                onChange={(e) => setFields((f) => ({ ...f, accountableEmail: e.target.value }))} />
            </div>
          </div>

          <div style={ES.field}>
            <label style={ES.label}>How is this tool used?</label>
            <textarea style={{ ...ES.input, height: 72, resize: "vertical" }}
              placeholder="e.g. Used by the marketing team to draft blog posts and email copy"
              value={fields.usageDescription}
              onChange={(e) => setFields((f) => ({ ...f, usageDescription: e.target.value }))} />
          </div>

          {isHigh && (
            <div style={{
              ...ES.field,
              background: !fields.oversightProcedure.trim() ? "var(--danger-bg)" : "transparent",
              padding: !fields.oversightProcedure.trim() ? "12px" : "0",
              borderRadius: 8,
              border: !fields.oversightProcedure.trim() ? "1px solid var(--danger-border)" : "none",
            }}>
              <label style={{ ...ES.label, color: !fields.oversightProcedure.trim() ? "var(--danger)" : "var(--text-secondary)" }}>
                Human oversight procedure
                {!fields.oversightProcedure.trim() && (
                  <span style={{ fontSize: 11, marginLeft: 6, fontWeight: 400 }}>
                    (required for high-risk tools, affects your compliance score)
                  </span>
                )}
              </label>
              <textarea style={{ ...ES.input, height: 96, resize: "vertical" }}
                placeholder="Describe how AI outputs are reviewed by a human before any decision is made. Who reviews? How can they override? e.g. 'Our HR manager reviews all candidate rankings before anyone is contacted and can remove any candidate without justification.'"
                value={fields.oversightProcedure}
                onChange={(e) => setFields((f) => ({ ...f, oversightProcedure: e.target.value }))} />
            </div>
          )}

          {/* Vendor compliance */}
          <div style={{ ...ES.field, marginBottom: 20 }}>
            <label style={ES.label}>Has the vendor published an EU AI Act compliance statement?</label>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              {[
                { val: true,  label: "Yes, vendor is compliant" },
                { val: false, label: "No / not confirmed" },
              ].map(({ val, label }) => (
                <button
                  key={String(val)}
                  onClick={() => handleVendorToggle(val)}
                  className={fields.vendorCompliance === val ? "" : "btn-outline-dark"}
                  style={{
                    padding: "7px 14px", fontSize: 12, fontWeight: 500,
                    borderRadius: 7, cursor: "pointer", fontFamily: "Inter, sans-serif",
                    border: "1.5px solid",
                    borderColor: fields.vendorCompliance === val ? "var(--btn-primary-bg)" : "var(--border)",
                    background: fields.vendorCompliance === val ? "var(--btn-primary-bg)" : "var(--bg-card)",
                    color: fields.vendorCompliance === val ? "var(--btn-primary-text)" : "var(--text-secondary)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setExpanded(false)} className="btn-ghost" style={ES.btnCancel}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className={saving ? "" : "btn-dark"} style={ES.btnSave}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const ES: Record<string, React.CSSProperties> = {
  row:       { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  field:     { display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 },
  label:     { fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" },
  input:     { padding: "8px 11px", border: "1.5px solid var(--border)", borderRadius: 7,
               fontSize: 13, color: "var(--text-primary)", fontFamily: "Inter, sans-serif",
               background: "var(--bg-card)", width: "100%" },
  btnCancel: { padding: "8px 16px", background: "var(--bg-card)", color: "var(--text-secondary)",
               border: "1.5px solid var(--border)", borderRadius: 7, fontSize: 13,
               fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" },
  btnSave:   { padding: "8px 16px", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)",
               border: "none", borderRadius: 7, fontSize: 13,
               fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" },
};
