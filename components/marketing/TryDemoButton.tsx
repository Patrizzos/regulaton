// components/marketing/TryDemoButton.tsx
//
// Drop this wherever you want the "Try the demo" CTA on the marketing page.
// POSTs to /api/demo/create, which redirects to /dashboard?demo=1 on success.
// No form, no sign-up, just a button.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TryDemoButton({
  label   = "Try the demo",
  variant = "primary",          // "primary" | "secondary"
}: {
  label?:   string;
  variant?: "primary" | "secondary";
}) {
  const router           = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/demo/create", { method: "POST" });

      if (res.redirected) {
        // Fetch followed the redirect — we need to navigate there
        router.push(new URL(res.url).pathname + new URL(res.url).search);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }

      // Should not normally reach here — the route always redirects
      router.push("/dashboard?demo=1");
    } catch (err: any) {
      setError(err.message ?? "Failed to create demo. Please try again.");
      setLoading(false);
    }
  }

  const primaryStyle: React.CSSProperties = {
    display:         "inline-flex",
    alignItems:      "center",
    gap:             8,
    padding:         "12px 24px",
    background:      "#059669",
    color:           "#fff",
    border:          "none",
    borderRadius:    8,
    fontSize:        15,
    fontWeight:      500,
    cursor:          loading ? "wait" : "pointer",
    opacity:         loading ? 0.7 : 1,
    transition:      "opacity 0.15s, transform 0.1s",
    textDecoration:  "none",
    fontFamily:      "inherit",
  };

  const secondaryStyle: React.CSSProperties = {
    ...primaryStyle,
    background: "transparent",
    color:      "var(--text-primary)",
    border:     "1px solid var(--border)",
  };

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 6 }}>
      <button
        onClick={handleClick}
        disabled={loading}
        style={variant === "primary" ? primaryStyle : secondaryStyle}
      >
        {loading ? (
          <>
            <span
              style={{
                display:      "inline-block",
                width:        14,
                height:       14,
                border:       "2px solid currentColor",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation:    "spin 0.6s linear infinite",
              }}
              aria-hidden="true"
            />
            Setting up demo…
          </>
        ) : label}
      </button>
      {error && (
        <p style={{ fontSize: 12, color: "var(--text-danger)", margin: 0 }}>
          {error}
        </p>
      )}
      {/* Spinner keyframe — only injected once, harmless if duplicated */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
