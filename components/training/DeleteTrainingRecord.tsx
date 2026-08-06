"use client";
// components/training/DeleteTrainingRecord.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteTrainingRecord({ id, name }: { id: string; name: string }) {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Remove training record for ${name}?`)) return;
    setLoading(true);
    try {
      await fetch(`/api/training/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={loading ? "" : "btn-danger-ghost"}
      style={{
        background: "none", border: "none", cursor: "pointer",
        fontSize: 12, color: "var(--text-muted)", padding: "4px 8px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {loading ? "…" : "Remove"}
    </button>
  );
}
