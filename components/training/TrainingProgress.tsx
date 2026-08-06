"use client";
// components/training/TrainingProgress.tsx
// Shows trained/target ratio with a progress bar.
// Lets the user set or update their training target inline.

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  trained: number;
  target: number | null;
}

export function TrainingProgress({ trained, target }: Props) {
  const router = useRouter();
  const [editing, setEditing]   = useState(false);
  const [value, setValue]       = useState(String(target ?? ""));
  const [saving, setSaving]     = useState(false);

  const pct = target ? Math.min(Math.round((trained / target) * 100), 100) : null;
  const isComplete = target !== null && trained >= target;

  async function handleSave() {
    const num = parseInt(value, 10);
    if (!num || num < 1) return;
    setSaving(true);
    try {
      await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingTarget: num }),
      });
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "20px 24px",
      marginBottom: 24,
    }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ marginBottom: 14, gap: 12 }}>
        {/* Left: ratio */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{
            fontFamily: "IBM Plex Mono, monospace",
            fontSize: 32,
            fontWeight: 500,
            color: isComplete ? "var(--success)" : "var(--text-primary)",
            lineHeight: 1,
          }}>
            {trained}
          </span>
          {target !== null && (
            <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 16, color: "var(--text-muted)" }}>
              / {target}
            </span>
          )}
          <span style={{ fontSize: 14, color: "var(--text-secondary)", marginLeft: 4 }}>
            staff trained
          </span>
          {isComplete && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
              background: "var(--success-bg)", color: "var(--success)", border: "1px solid var(--success-border)",
              fontFamily: "IBM Plex Mono, monospace", marginLeft: 8,
            }}>
              ✓ COMPLETE
            </span>
          )}
        </div>

        {/* Right: set target */}
        {editing ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="number"
              min={1}
              style={{
                width: 72, padding: "6px 10px",
                border: "1.5px solid var(--btn-primary-bg)", borderRadius: 6,
                fontSize: 14, fontFamily: "IBM Plex Mono, monospace",
                color: "var(--text-primary)", textAlign: "center", background: "var(--bg-card)",
              }}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className={saving ? "" : "btn-dark"}
              style={{
                padding: "6px 14px", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)",
                border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}
            >
              {saving ? "…" : "Set"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="link-hover"
              style={{
                padding: "6px 10px", background: "none", border: "none",
                fontSize: 12, color: "var(--text-muted)", cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setValue(String(target ?? "")); setEditing(true); }}
            className="btn-ghost"
            style={{
              padding: "6px 14px", background: "var(--bg-card)", color: "var(--text-secondary)",
              border: "1.5px solid var(--border)", borderRadius: 6, fontSize: 12,
              fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}
          >
            {target === null ? "Set training target" : "Change target"}
          </button>
        )}
      </div>

      {/* Progress bar */}
      {target !== null && (
        <div>
          <div style={{
            height: 8, background: "var(--bg-subtle)", borderRadius: 4,
            overflow: "hidden", marginBottom: 6,
          }}>
            <div style={{
              height: "100%",
              width: `${pct}%`,
              background: isComplete ? "var(--success)" : pct! >= 50 ? "var(--warning)" : "var(--danger)",
              borderRadius: 4,
              transition: "width 0.5s ease",
            }} />
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {isComplete
              ? "All staff trained. Article 4 literacy obligation met."
              : `${target - trained} more staff member${target - trained === 1 ? "" : "s"} to go`}
          </div>
        </div>
      )}

      {/* No target set */}
      {target === null && (
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
          Set a target to track progress toward full Article 4 compliance.
          This is the number of staff who use AI tools in your organisation.
        </p>
      )}
    </div>
  );
}
