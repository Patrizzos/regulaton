"use client";
// components/training/AddTrainingRecord.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TRAINING_TYPE_LABELS } from "@/lib/training-labels";

const TRAINING_TYPES = Object.entries(TRAINING_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export function AddTrainingRecord() {
  const router = useRouter();
  const [open, setOpen]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [form, setForm]       = useState({
    staffName:     "",
    staffEmail:    "",
    completedAt:   new Date().toISOString().split("T")[0],
    trainingTypes: ["EU_AI_ACT_LITERACY_BASICS"] as string[],
    notes:         "",
    evidenceUrl:   "",
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleType(value: string) {
    setForm((f) => {
      const has = f.trainingTypes.includes(value);
      const trainingTypes = has
        ? f.trainingTypes.filter((t) => t !== value)
        : [...f.trainingTypes, value];
      return { ...f, trainingTypes };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.trainingTypes.length === 0) {
      setError("Select at least one training type.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setForm({
        staffName: "", staffEmail: "",
        completedAt: new Date().toISOString().split("T")[0],
        trainingTypes: ["EU_AI_ACT_LITERACY_BASICS"],
        notes: "", evidenceUrl: "",
      });
      setOpen(false);
      router.refresh();
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-dark"
        style={{
          padding: "9px 18px",
          background: "var(--btn-primary-bg)",
          color: "var(--btn-primary-text)",
          border: "none",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "Inter, sans-serif",
        }}
      >
        + Add record
      </button>

      {/* Modal */}
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
              Add training record
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 24px" }}>
              Article 4 requires documented evidence of staff AI literacy training.
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

              <div style={S.field}>
                <label style={S.label}>Date completed</label>
                <input style={S.input} required type="date"
                  value={form.completedAt}
                  onChange={(e) => update("completedAt", e.target.value)} />
              </div>

              <div style={S.field}>
                <label style={S.label}>
                  Training type{form.trainingTypes.length > 1 ? "s" : ""} <span style={{ color: "var(--text-muted)" }}>(select all that apply)</span>
                </label>
                <div style={{
                  display: "flex", flexDirection: "column", gap: 2,
                  border: "1.5px solid var(--border)", borderRadius: 7, padding: "4px 2px",
                }}>
                  {TRAINING_TYPES.map((t) => (
                    <label key={t.value} style={{
                      display: "flex", alignItems: "center", gap: 9,
                      padding: "7px 9px", borderRadius: 5, cursor: "pointer",
                      fontSize: 13, color: "var(--text-primary)",
                    }}>
                      <input
                        type="checkbox"
                        checked={form.trainingTypes.includes(t.value)}
                        onChange={() => toggleType(t.value)}
                        style={{ width: 15, height: 15, accentColor: "var(--btn-primary-bg)", flexShrink: 0 }}
                      />
                      {t.label}
                    </label>
                  ))}
                </div>
                {error && (
                  <div style={{ fontSize: 12, color: "var(--danger)" }}>{error}</div>
                )}
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

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" onClick={() => setOpen(false)} className="btn-ghost" style={S.btnCancel}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className={saving ? "" : "btn-dark"} style={S.btnSubmit}>
                  {saving ? "Saving…" : form.trainingTypes.length > 1 ? `Add ${form.trainingTypes.length} records` : "Add record"}
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
