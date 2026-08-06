"use client";
// components/documents/FinaliseButton.tsx
// Client component — calls the finalise API then refreshes the page.

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FinaliseButton({ docType }: { docType: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  async function handleFinalise() {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${docType}/finalise`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      setDone(true);
      router.refresh(); // re-fetch server component data
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span style={{
        padding: "9px 18px",
        background: "var(--success-bg)",
        color: "var(--success)",
        border: "1.5px solid var(--success-border)",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
      }}>
        ✓ Finalised
      </span>
    );
  }

  return (
    <button
      onClick={handleFinalise}
      disabled={loading}
      className={loading ? "" : "btn-green"}
      style={{
        padding: "9px 18px",
        background: loading ? "var(--text-muted)" : "#059669",
        color: "white",
        border: "none",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {loading ? "Saving…" : "Mark as finalised ✓"}
    </button>
  );
}
