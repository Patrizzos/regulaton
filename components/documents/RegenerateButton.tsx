"use client";
// components/documents/RegenerateButton.tsx
// Shown when a document status is NEEDS_UPDATE.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { handleMutationError } from "@/lib/api-error";

export function RegenerateButton({ docType }: { docType: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRegenerate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${docType}/regenerate`, {
        method: "POST",
      });
      if (!res.ok) {
        await handleMutationError(res, router);
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRegenerate}
      disabled={loading}
      className={loading ? "" : "btn-amber"}
      style={{
        padding: "8px 18px",
        background: loading ? "var(--text-muted)" : "#D97706",
        color: "white",
        border: "none",
        borderRadius: 7,
        fontSize: 13,
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {loading ? "Regenerating…" : "↻ Regenerate"}
    </button>
  );
}
