"use client";
// components/dashboard/AlertFeed.tsx
// Renders alerts with mark-as-read on click + mark all button.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Alert {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: Date;
}

export function AlertFeed({ alerts: initial }: { alerts: Alert[] }) {
  const router = useRouter();
  const [alerts, setAlerts] = useState(initial);
  const unread = alerts.filter((a) => !a.isRead).length;

  async function markOne(id: string) {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, isRead: true } : a));
    await fetch(`/api/alerts/${id}`, { method: "PATCH" });
    router.refresh();
  }

  async function markAll() {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    await fetch("/api/alerts", { method: "PATCH" });
    router.refresh();
  }

  if (alerts.length === 0) {
    return (
      <div style={{
        textAlign: "center", padding: "40px 20px",
        background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12,
      }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>No alerts</div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
          We'll alert you when something needs your attention.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{
          fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 18,
          fontWeight: 600, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.01em",
        }}>
          Recent alerts
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {unread > 0 && (
            <>
              <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, color: "var(--danger)", fontWeight: 600 }}>
                {unread} unread
              </span>
              <button
                onClick={markAll}
                className="link-hover"
                style={{
                  fontSize: 12, fontWeight: 500, color: "var(--text-secondary)",
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "Inter, sans-serif", textDecoration: "underline",
                }}
              >
                Mark all read
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {alerts.map((alert) => (
          <div
            key={alert.id}
            onClick={() => !alert.isRead && markOne(alert.id)}
            className={alert.isRead ? "" : "card-hover"}
            style={{
              background: alert.isRead ? "var(--bg-subtle)" : "var(--bg-card)",
              border: "1px solid",
              borderColor: alert.isRead ? "var(--border)" : "var(--border-strong)",
              borderRadius: 10,
              padding: "14px 16px",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              cursor: alert.isRead ? "default" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {/* Unread dot */}
            <div style={{
              width: 7, height: 7, borderRadius: "50%", marginTop: 5, flexShrink: 0,
              background: alert.isRead ? "transparent" : "var(--danger)",
              border: alert.isRead ? "1px solid var(--border-strong)" : "none",
            }} />

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>
                {alert.title}
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                {alert.message}
              </p>
              {alert.actionUrl && (
                <Link
                  href={alert.actionUrl}
                  onClick={(e) => e.stopPropagation()}
                  className="link-hover"
                  style={{ display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 600, color: "var(--text-primary)", textDecoration: "none" }}
                >
                  Take action →
                </Link>
              )}
            </div>

            <span style={{
              fontSize: 11, color: "var(--text-muted)", flexShrink: 0,
              fontFamily: "IBM Plex Mono, monospace", marginTop: 2,
            }}>
              {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
