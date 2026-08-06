"use client";
// components/training/EditTrainingRecord.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TRAINING_TYPE_LABELS } from "@/lib/training-labels";

const TRAINING_TYPES = Object.entries(TRAINING_TYPE_LABELS).map(([value, label]) => ({ value, label }));

interface Props {
  record: {
    id: string;
    staffName: string;
    staffEmail: string;
    completedAt: string | Date;
    trainingType: string;
    notes: string | null;
    evidenceUrl: string | null;
  };
}

function toDateInputValue(date: string | Date): string {
  return new Date(date).toISOString().split("T")[0];
}

export function EditTrainingRecord({ record }: Props) {
  const router = useRouter();
  const [open, setOpen]     = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [form, setForm]     = useState({
    staffName:    record.staffName,
    staffEmail:   record.staffEmail,
    completedAt:  toDateInputValue(record.completedAt),
    trainingType: record.trainingType,
    notes:        record.notes ?? "",
    evidenceUrl:  record.evidenceUrl ?? "",
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function openModal() {
    setForm({
      staffName:    record.staffName,
      staffEmail:   record.staffEmail,
      completedAt:  toDateInputValue(record.completedAt),
      trainingType: record.trainingType,
      notes:        record.notes ?? "",
      evidenceUrl:  record.evidenceUrl ?? "",
    });
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/training/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="link-hover"
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 12, color: "var(--text-muted)", padding: "4px 8px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        Edit
      </button>

      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24,
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="p-5 sm:p-8" style={{
            background: "var(--bg-card)", borderRadius: 14,
            width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)", border: "1px solid var(--border)",
          }}>
            <h2 style={{
              fontFamily: "IBM Plex Serif, Georgia, serif",
              fontSize: 20, fontWeight: 600, color: "var(--text-primary)",
              margin: "0 0 4px", letterSpacing: "-0.01em",
            }}>
              Edit training record
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 24px" }}>
              Correct any detail below. To log an additional training type for this person, use "+ Add record" instead.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={S.row}>
                <div style={S.field}>
                  <label style={S.label}>Full name</label>
                  <input style={S.input} required placeholder="Jane Smith"
                    value={form.staffName}
                    onChange={(e) => update("staffName", e.target.value)} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Work email</label>
                  <input style={S.input} required type="email" placeholder="jane@company.com"
                    value={form.staffEmail}
                    onChange={(e) => update("staffEmail", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2" style={S.row}>
                <div style={S.field}>
                  <label style={S.label}>Date completed</label>
                  <input style={S.input} required type="date"
                    value={form.completedAt}
                    onChange={(e) => update("completedAt", e.target.value)} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Training type</label>
                  <select style={S.input}
                    value={form.trainingType}
                    onChange={(e) => update("trainingType", e.target.value)}>
                    {TRAINING_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={S.field}>
                <label style={S.label}>Evidence URL <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
                <input style={S.input} type="url" placeholder="https://certificate-link.com"
                  value={form.evidenceUrl}
                  onChange={(e) => update("evidenceUrl", e.target.value)} />
              </div>

              <div style={S.field}>
                <label style={S.label}>Notes <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
                <textarea style={{ ...S.input, height: 72, resize: "vertical" }}
                  placeholder="e.g. Completed internal AI policy workshop"
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)} />
              </div>

              {error && (
                <div style={{
                  fontSize: 12.5, color: "var(--danger)", background: "var(--danger-bg)",
                  border: "1px solid var(--danger-border)", borderRadius: 7,
                  padding: "8px 11px", marginBottom: 14,
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" onClick={() => setOpen(false)} className="btn-ghost" style={S.btnCancel}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className={saving ? "" : "btn-dark"} style={S.btnSubmit}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const S: Record<string, React.CSSProperties> = {
  row:       { gap: 12, marginBottom: 0 },
  field:     { display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 },
  label:     { fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" },
  input:     { padding: "8px 11px", border: "1.5px solid var(--border)", borderRadius: 7,
               fontSize: 13, color: "var(--text-primary)", fontFamily: "Inter, sans-serif", width: "100%",
               background: "var(--bg-card)" },
  btnCancel: { padding: "9px 18px", background: "var(--bg-card)", color: "var(--text-secondary)",
               border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13,
               fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" },
  btnSubmit: { padding: "9px 18px", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)",
               border: "none", borderRadius: 8, fontSize: 13,
               fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" },
};
