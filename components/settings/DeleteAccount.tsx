"use client";
// components/settings/DeleteAccount.tsx

import { useState } from "react";
import { signOut } from "next-auth/react";

interface Props {
  isSoleOwner: boolean;
  orgName: string;
}

export function DeleteAccount({ isSoleOwner, orgName }: Props) {
  const [open, setOpen]       = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError]     = useState("");

  const CONFIRM_PHRASE = "delete my account";
  const isReady = confirm.toLowerCase() === CONFIRM_PHRASE;

  async function handleDelete() {
    if (!isReady) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
      // Sign out and redirect to homepage
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("Something went wrong. Please try again or contact support.");
      setDeleting(false);
    }
  }

  return (
    <div className="px-4 py-5 sm:px-7 sm:py-6" style={{
      background: "var(--bg-card)", border: "1px solid var(--danger-border)",
      borderRadius: 12, marginBottom: 16,
    }}>
      <h2 style={{
        fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 18,
        fontWeight: 600, color: "var(--danger)", margin: "0 0 4px",
      }}>
        Delete account
      </h2>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 16px", lineHeight: 1.6 }}>
        {isSoleOwner
          ? `Permanently deletes your account and all data for ${orgName}, including documents, tools, and training records. This cannot be undone.`
          : "Removes you from this organisation. Your account will be deleted but the organisation's data will be preserved."}
      </p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="btn-danger-ghost"
          style={{
            padding: "8px 18px", background: "var(--bg-card)", color: "var(--danger)",
            border: "1.5px solid var(--danger-border)", borderRadius: 8, fontSize: 13,
            fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif",
          }}
        >
          Delete account
        </button>
      ) : (
        <div style={{
          padding: "20px", background: "var(--danger-bg)",
          border: "1px solid var(--danger-border)", borderRadius: 10,
        }}>
          <p style={{ fontSize: 13, color: "var(--danger)", margin: "0 0 14px", lineHeight: 1.6, fontWeight: 500 }}>
            {isSoleOwner
              ? `This will permanently delete your account and all data for ${orgName}.`
              : "This will remove you from the organisation and delete your account."}
            {" "}Type <strong>delete my account</strong> to confirm.
          </p>
          <input
            style={{
              width: "100%", padding: "9px 12px",
              border: "1.5px solid var(--danger-border)", borderRadius: 7,
              fontSize: 13, color: "var(--text-primary)", fontFamily: "Inter, sans-serif",
              background: "var(--bg-card)", marginBottom: 12,
            }}
            placeholder="delete my account"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoFocus
          />
          {error && (
            <p style={{ fontSize: 13, color: "var(--danger)", margin: "0 0 12px" }}>{error}</p>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleDelete}
              disabled={!isReady || deleting}
              className={isReady && !deleting ? "btn-red" : ""}
              style={{
                padding: "9px 20px",
                background: isReady ? "#DC2626" : "var(--text-muted)",
                color: "white", border: "none", borderRadius: 8,
                fontSize: 13, fontWeight: 600,
                cursor: isReady ? "pointer" : "not-allowed",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {deleting ? "Deleting…" : "Permanently delete"}
            </button>
            <button
              onClick={() => { setOpen(false); setConfirm(""); setError(""); }}
              disabled={deleting}
              className="btn-ghost"
              style={{
                padding: "9px 18px", background: "var(--bg-card)", color: "var(--text-secondary)",
                border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13,
                fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
