"use client";
// components/settings/BillingSection.tsx

import { useState } from "react";
import { PLANS, PlanKey } from "@/lib/plans";

interface Props {
  plan: string;
  status: string;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  hasStripeCustomer: boolean;
  isAdmin: boolean;
}

const UPGRADE_PLANS = Object.keys(PLANS) as PlanKey[];

export function BillingSection({ plan, status, trialEndsAt, currentPeriodEnd, hasStripeCustomer, isAdmin }: Props) {
  const [upgrading, setUpgrading]   = useState<string | null>(null);
  const [portalLoading, setPortal]  = useState(false);

  const isTrial   = status === "TRIALING";
  const isActive  = status === "ACTIVE";
  const isPastDue = status === "PAST_DUE";
  const details   = PLANS[plan as PlanKey] ?? PLANS.SOLO;

  async function handleUpgrade(targetPlan: string) {
    setUpgrading(targetPlan);
    try {
      const res  = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Failed to start checkout. Please try again.");
      }
    } catch {
      alert("Failed to start checkout. Please try again.");
    } finally {
      setUpgrading(null);
    }
  }

  async function handlePortal() {
    setPortal(true);
    try {
      const res  = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error ?? "Failed to open billing portal.");
    } catch {
      alert("Failed to open billing portal.");
    } finally {
      setPortal(false);
    }
  }

  return (
    <div id="billing" className="px-4 py-5 sm:px-7 sm:py-6" style={{ ...S.card, scrollMarginTop: 80 }}>
      <h2 style={S.cardTitle}>Billing & plan</h2>
      <p style={S.cardSub}>Manage your subscription and payment method.</p>

      {/* Current plan */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{
        padding: "14px 18px", background: "var(--bg-subtle)",
        border: "1px solid var(--border)", borderRadius: 10, marginBottom: 20, gap: 12,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
              {details.label} plan
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20,
              fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.04em",
              ...(isTrial
                ? { background: "var(--warning-bg)", color: "var(--warning)", border: "1px solid var(--warning-border)" }
                : isActive
                ? { background: "var(--success-bg)", color: "var(--success)", border: "1px solid var(--success-border)" }
                : isPastDue
                ? { background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid var(--danger-border)" }
                : { background: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border)" }),
            }}>
              {isTrial ? "TRIAL" : status}
            </span>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            {details.price} · {details.employees}
            {isTrial && trialEndsAt && (
              <span style={{ color: "var(--warning)", marginLeft: 8 }}>
                · Trial ends {new Date(trialEndsAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
              </span>
            )}
            {isActive && currentPeriodEnd && (
              <span style={{ color: "var(--text-secondary)", marginLeft: 8 }}>
                · Renews {new Date(currentPeriodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
              </span>
            )}
          </div>
        </div>

        {hasStripeCustomer && isAdmin && (
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className={portalLoading ? "" : "btn-outline-dark"}
            style={{
              padding: "8px 16px", background: "var(--bg-card)", color: "var(--text-primary)",
              border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13,
              fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}
          >
            {portalLoading ? "Opening…" : "Manage billing →"}
          </button>
        )}
      </div>

      {!isAdmin && (
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "-8px 0 20px" }}>
          Only org owners and admins can manage billing.
        </p>
      )}

      {/* Past due warning */}
      {isPastDue && (
        <div style={{
          padding: "12px 16px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)",
          borderRadius: 8, fontSize: 13, color: "var(--danger)", marginBottom: 20,
        }}>
          <strong>Payment failed.</strong> {isAdmin ? (
            <>
              Update your payment method to keep access to Regulaton.{" "}
              <button onClick={handlePortal} className="link-hover" style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "Inter, sans-serif", textDecoration: "underline" }}>
                Update now
              </button>
            </>
          ) : (
            "Ask an org owner or admin to update the payment method to keep access to Regulaton."
          )}
        </div>
      )}

      {/* Upgrade options — shown during trial or on lower plans */}
      {(isTrial || isActive) && isAdmin && (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>
            {isTrial ? "Choose a plan to continue after your trial:" : "Switch plan:"}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 10 }}>
            {UPGRADE_PLANS.map((p) => {
              const d         = PLANS[p];
              const isCurrent = p === plan && isActive;
              return (
                <div
                  key={p}
                  style={{
                    padding: "16px", borderRadius: 10, border: "1.5px solid",
                    borderColor: isCurrent ? "var(--btn-primary-bg)" : "var(--border)",
                    background: isCurrent ? "var(--bg-subtle)" : "var(--bg-card)",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{d.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{d.price}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14 }}>{d.employees}</div>
                  <button
                    onClick={() => handleUpgrade(p)}
                    disabled={isCurrent || !!upgrading}
                    className={isCurrent || upgrading ? "" : "btn-dark"}
                    style={{
                      width: "100%", padding: "7px", fontSize: 12, fontWeight: 600,
                      borderRadius: 7, border: "none", cursor: isCurrent ? "default" : "pointer",
                      fontFamily: "Inter, sans-serif",
                      background: isCurrent ? "var(--border)" : "var(--btn-primary-bg)",
                      color: isCurrent ? "var(--text-muted)" : "var(--btn-primary-text)",
                    }}
                  >
                    {isCurrent ? "Current plan" : upgrading === p ? "Opening…" : "Select"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  card:      { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 16 },
  cardTitle: { fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" },
  cardSub:   { fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px" },
};
