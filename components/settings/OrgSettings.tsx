"use client";
// components/settings/OrgSettings.tsx
// Inline editing for org name, country, industry — owners/admins only.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { handleMutationError } from "@/lib/api-error";

const EU_COUNTRIES = [
  { code: "AT", name: "Austria" }, { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" }, { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czechia" }, { code: "DE", name: "Germany" },
  { code: "DK", name: "Denmark" }, { code: "EE", name: "Estonia" },
  { code: "ES", name: "Spain" }, { code: "FI", name: "Finland" },
  { code: "FR", name: "France" }, { code: "GR", name: "Greece" },
  { code: "HR", name: "Croatia" }, { code: "HU", name: "Hungary" },
  { code: "IE", name: "Ireland" }, { code: "IT", name: "Italy" },
  { code: "LT", name: "Lithuania" }, { code: "LU", name: "Luxembourg" },
  { code: "LV", name: "Latvia" }, { code: "MT", name: "Malta" },
  { code: "NL", name: "Netherlands" }, { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" }, { code: "RO", name: "Romania" },
  { code: "SE", name: "Sweden" }, { code: "SI", name: "Slovenia" },
  { code: "SK", name: "Slovakia" }, { code: "GB", name: "United Kingdom" },
  { code: "NO", name: "Norway" }, { code: "CH", name: "Switzerland" },
];

const INDUSTRIES = [
  "Technology / Software", "Marketing / Advertising", "Legal / Compliance",
  "Finance / Accounting", "Healthcare / Medical", "E-commerce / Retail",
  "Consulting / Professional Services", "Media / Publishing",
  "Education / Training", "Manufacturing", "Logistics / Supply Chain",
  "Real Estate", "Architecture / Design", "HR / Recruitment", "Other",
];

interface Props {
  org: {
    name: string;
    country: string;
    industry: string | null;
    vatNumber: string | null;
  };
  isAdmin: boolean;
}

export function OrgSettings({ org, isAdmin }: Props) {
  const router  = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [fields, setFields] = useState({
    name:       org.name,
    country:    org.country,
    industry:   org.industry ?? "",
    vatNumber:  org.vatNumber ?? "",
  });

  function update(key: string, val: string) {
    setFields((f) => ({ ...f, [key]: val }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:      fields.name,
          country:   fields.country,
          industry:  fields.industry || null,
          vatNumber: fields.vatNumber || null,
        }),
      });
      if (!res.ok) {
        await handleMutationError(res, router);
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 py-5 sm:px-7 sm:py-6" style={S.card}>
      <h2 style={S.cardTitle}>Organisation details</h2>
      <p style={S.cardSub}>
        These details appear in your generated compliance documents.
        {!isAdmin && " Only org owners and admins can edit these."}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 16, marginBottom: 16 }}>
        <div style={S.field}>
          <label style={S.label}>Organisation name</label>
          <input style={S.input} disabled={!isAdmin}
            value={fields.name}
            onChange={(e) => update("name", e.target.value)} />
        </div>
        <div style={S.field}>
          <label style={S.label}>Country</label>
          <select style={S.input} disabled={!isAdmin}
            value={fields.country}
            onChange={(e) => update("country", e.target.value)}>
            {EU_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 16, marginBottom: 20 }}>
        <div style={S.field}>
          <label style={S.label}>Industry</label>
          <select style={S.input} disabled={!isAdmin}
            value={fields.industry}
            onChange={(e) => update("industry", e.target.value)}>
            <option value="">Select industry</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div style={S.field}>
          <label style={S.label}>VAT number <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
          <input style={S.input} disabled={!isAdmin} placeholder="e.g. DE123456789"
            value={fields.vatNumber}
            onChange={(e) => update("vatNumber", e.target.value)} />
        </div>
      </div>

      {isAdmin && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className={saving ? "" : "btn-dark"}
            style={{
              padding: "9px 20px", background: saving ? "var(--text-muted)" : "var(--btn-primary-bg)",
              color: "var(--btn-primary-text)", border: "none", borderRadius: 8, fontSize: 13,
              fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && (
            <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 500 }}>
              ✓ Saved
            </span>
          )}
        </div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  card:     { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 16 },
  cardTitle: { fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" },
  cardSub:  { fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px" },
  field:    { display: "flex", flexDirection: "column", gap: 5 },
  label:    { fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" },
  input:    { padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: 13, color: "var(--text-primary)", fontFamily: "Inter, sans-serif", width: "100%", background: "var(--bg-card)" },
};
