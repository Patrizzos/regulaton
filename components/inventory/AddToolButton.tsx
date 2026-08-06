"use client";
// components/inventory/AddToolButton.tsx
// Opens a modal to add a tool from the library or create a custom one.

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "WRITING_CONTENT",    label: "Writing & Content" },
  { value: "CUSTOMER_SUPPORT",   label: "Customer Support" },
  { value: "RECRUITING_HR",      label: "Recruiting & HR" },
  { value: "FINANCE_ACCOUNTING", label: "Finance & Accounting" },
  { value: "CODING_DEVELOPMENT", label: "Coding & Development" },
  { value: "DATA_ANALYTICS",     label: "Data Analytics" },
  { value: "MARKETING",          label: "Marketing" },
  { value: "PRODUCTIVITY",       label: "Productivity" },
  { value: "IMAGE_VIDEO_GEN",    label: "Image & Video Generation" },
  { value: "RESEARCH",           label: "Research" },
  { value: "LEGAL",              label: "Legal" },
  { value: "TRANSLATION",        label: "Translation" },
  { value: "VOICE_AUDIO",        label: "Voice & Audio" },
  { value: "OTHER",              label: "Other" },
];

const RISK_LEVELS = [
  { value: "MINIMAL",  label: "Minimal (no specific obligations)" },
  { value: "LIMITED",  label: "Limited (transparency required)" },
  { value: "HIGH",     label: "High: Annex III (recruiting, credit, etc.)" },
];

export function AddToolButton() {
  const router = useRouter();
  const [open, setOpen]       = useState(false);
  const [tab, setTab]         = useState<"library" | "custom">("library");
  const [search, setSearch]   = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [saving, setSaving]   = useState(false);
  const [custom, setCustom]   = useState({
    customName: "", customProvider: "",
    riskLevel: "LIMITED", category: "OTHER",
  });

  async function searchLibrary(q: string) {
    setSearch(q);
    if (q.length < 2) { setResults([]); return; }
    const res  = await fetch(`/api/tools?library=true&q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data);
  }

  async function addLibraryTool(tool: any) {
    setSaving(true);
    try {
      await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          libraryToolId: tool.id,
          riskLevel:     tool.defaultRiskLevel,
          category:      tool.category,
        }),
      });
      setOpen(false);
      setSearch("");
      setResults([]);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function addCustomTool() {
    if (!custom.customName) return;
    setSaving(true);
    try {
      await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(custom),
      });
      setOpen(false);
      setCustom({ customName: "", customProvider: "", riskLevel: "LIMITED", category: "OTHER" });
      router.refresh();
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
          padding: "9px 18px", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)",
          border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "Inter, sans-serif",
        }}
      >
        + Add tool
      </button>

      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="p-5 sm:p-8" style={{
            background: "var(--bg-card)", borderRadius: 14,
            width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)", border: "1px solid var(--border)",
          }}>
            <h2 style={{
              fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 20,
              fontWeight: 600, color: "var(--text-primary)", margin: "0 0 20px",
            }}>
              Add AI tool
            </h2>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "2px solid var(--border)" }}>
              {(["library", "custom"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="nav-link-hover"
                  style={{
                    padding: "8px 16px", background: "none", border: "none",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                    color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
                    borderBottom: `2px solid ${tab === t ? "var(--text-primary)" : "transparent"}`,
                    marginBottom: -2,
                  }}
                >
                  {t === "library" ? "From library" : "Custom tool"}
                </button>
              ))}
            </div>

            {tab === "library" ? (
              <div>
                <input
                  style={{
                    width: "100%", padding: "10px 12px",
                    border: "1.5px solid var(--border)", borderRadius: 8,
                    fontSize: 14, color: "var(--text-primary)", fontFamily: "Inter, sans-serif",
                    marginBottom: 12, background: "var(--bg-card)",
                  }}
                  placeholder="Search 40+ pre-classified tools…"
                  value={search}
                  onChange={(e) => searchLibrary(e.target.value)}
                  autoFocus
                />
                <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                  {results.length === 0 && search.length >= 2 && (
                    <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>
                      No tools found. Try the Custom tool tab.
                    </div>
                  )}
                  {results.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => addLibraryTool(tool)}
                      disabled={saving}
                      className="card-hover"
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "11px 14px", border: "1.5px solid var(--border)",
                        borderRadius: 8, background: "var(--bg-card)", cursor: "pointer",
                        textAlign: "left", width: "100%", fontFamily: "Inter, sans-serif",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{tool.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{tool.providerCompany}</div>
                      </div>
                      <span style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 600,
                        fontFamily: "IBM Plex Mono, monospace",
                        background: tool.defaultRiskLevel === "HIGH" ? "var(--danger-bg)" : tool.defaultRiskLevel === "LIMITED" ? "var(--warning-bg)" : "var(--success-bg)",
                        color: tool.defaultRiskLevel === "HIGH" ? "var(--danger)" : tool.defaultRiskLevel === "LIMITED" ? "var(--warning)" : "var(--success)",
                      }}>
                        {tool.defaultRiskLevel}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>
                      Tool name *
                    </label>
                    <input
                      style={{ width: "100%", padding: "8px 11px", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: 13, fontFamily: "Inter, sans-serif", background: "var(--bg-card)", color: "var(--text-primary)" }}
                      placeholder="e.g. Internal AI classifier"
                      value={custom.customName}
                      onChange={(e) => setCustom((c) => ({ ...c, customName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>
                      Provider / vendor
                    </label>
                    <input
                      style={{ width: "100%", padding: "8px 11px", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: 13, fontFamily: "Inter, sans-serif", background: "var(--bg-card)", color: "var(--text-primary)" }}
                      placeholder="e.g. Built in-house"
                      value={custom.customProvider}
                      onChange={(e) => setCustom((c) => ({ ...c, customProvider: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12, marginBottom: 20 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Category</label>
                    <select
                      style={{ width: "100%", padding: "8px 11px", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: 13, fontFamily: "Inter, sans-serif", background: "var(--bg-card)", color: "var(--text-primary)" }}
                      value={custom.category}
                      onChange={(e) => setCustom((c) => ({ ...c, category: e.target.value }))}
                    >
                      {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Risk level</label>
                    <select
                      style={{ width: "100%", padding: "8px 11px", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: 13, fontFamily: "Inter, sans-serif", background: "var(--bg-card)", color: "var(--text-primary)" }}
                      value={custom.riskLevel}
                      onChange={(e) => setCustom((c) => ({ ...c, riskLevel: e.target.value }))}
                    >
                      {RISK_LEVELS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button onClick={() => setOpen(false)} className="btn-ghost" style={{ padding: "8px 16px", background: "var(--bg-card)", color: "var(--text-secondary)", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                    Cancel
                  </button>
                  <button
                    onClick={addCustomTool}
                    disabled={!custom.customName || saving}
                    className={!custom.customName || saving ? "" : "btn-dark"}
                    style={{ padding: "8px 16px", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                  >
                    {saving ? "Adding…" : "Add tool"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
