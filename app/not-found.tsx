// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#F7F8FB",
      fontFamily: "Inter, sans-serif", padding: 24,
    }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{
          fontFamily: "IBM Plex Mono, monospace", fontSize: 64,
          fontWeight: 500, color: "#E2E8F0", lineHeight: 1, marginBottom: 16,
        }}>
          404
        </div>
        <h1 style={{
          fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 24,
          fontWeight: 600, color: "#1A2332", margin: "0 0 10px",
        }}>
          Page not found
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 28px", lineHeight: 1.6 }}>
          This page doesn't exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          style={{
            display: "inline-block", padding: "10px 24px",
            background: "#1A2332", color: "white", borderRadius: 8,
            fontSize: 14, fontWeight: 600, textDecoration: "none",
          }}
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
