"use client";
// app/error.tsx — root error boundary

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#F7F8FB",
      fontFamily: "Inter, sans-serif", padding: 24,
    }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <h1 style={{
          fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 24,
          fontWeight: 600, color: "#1A2332", margin: "0 0 10px",
        }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 28px", lineHeight: 1.6 }}>
          An unexpected error occurred. Your data is safe — try refreshing the page.
        </p>
        {error.digest && (
          <div style={{
            fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
            color: "#9CA3AF", marginBottom: 20,
          }}>
            Error ID: {error.digest}
          </div>
        )}
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{
              padding: "10px 24px", background: "#1A2332", color: "white",
              border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            style={{
              padding: "10px 24px", background: "white", color: "#1A2332",
              border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 14,
              fontWeight: 500, textDecoration: "none",
            }}
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
