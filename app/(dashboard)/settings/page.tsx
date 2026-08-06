// app/(dashboard)/settings/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { MemberRole } from "@prisma/client";
import { OrgSettings } from "@/components/settings/OrgSettings";
import { BillingSection } from "@/components/settings/BillingSection";
import { TeamSection } from "@/components/settings/TeamSection";
import { DeleteAccount } from "@/components/settings/DeleteAccount";
import { PlanKey } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { upgraded?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { id: session.orgId },
    include: {
      subscription: true,
      members: {
        include: { user: true },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!org) redirect("/onboarding");

  const sub         = org.subscription;
  const isOwner     = session.orgRole === MemberRole.OWNER;
  const isAdmin     = isOwner || session.orgRole === MemberRole.ADMIN;
  const memberCount = org.members.length;
  const isSoleOwner = isOwner && memberCount === 1;

  return (
    <div style={{ maxWidth: 720, width: "100%", fontFamily: "Inter, sans-serif" }}>

      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
          letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6,
        }}>
          Account
        </div>
        <h1 style={{
          fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 28,
          fontWeight: 600, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em",
        }}>
          Settings
        </h1>
      </div>

      {/* Upgrade success banner */}
      {searchParams.upgraded === "1" && (
        <div style={{
          padding: "14px 18px", background: "var(--success-bg)", border: "1px solid var(--success-border)",
          borderRadius: 10, fontSize: 14, color: "var(--success)", fontWeight: 500, marginBottom: 20,
        }}>
          ✓ Subscription activated. Thank you for subscribing to Regulaton!
        </div>
      )}

      {/* Organisation details */}
      <OrgSettings
        org={{
          name:      org.name,
          country:   org.country,
          industry:  org.industry,
          vatNumber: org.vatNumber,
        }}
      />

      {/* Team */}
      <TeamSection
        members={org.members as any}
        inviteToken={org.inviteToken}
        isOwner={isAdmin}
        plan={(sub?.plan ?? "SOLO") as PlanKey}
      />

      {/* Billing */}
      <BillingSection
        plan={sub?.plan ?? "SOLO"}
        status={sub?.status ?? "TRIALING"}
        trialEndsAt={sub?.trialEndsAt ?? null}
        currentPeriodEnd={sub?.currentPeriodEnd ?? null}
        hasStripeCustomer={!!sub?.stripeCustomerId}
      />

      {/* Account / sign out */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 12, padding: "24px 28px", marginBottom: 16,
      }}>
        <h2 style={{
          fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 18,
          fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px",
        }}>
          Account
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 16px" }}>
          Signed in as <strong>{session.user?.email}</strong>
        </p>
        <form action="/api/auth/signout" method="POST">
          <button type="submit" className="btn-ghost" style={{
            padding: "8px 18px", background: "var(--bg-card)", color: "var(--text-secondary)",
            border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13,
            fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif",
          }}>
            Sign out
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <DeleteAccount
        isSoleOwner={isSoleOwner}
        orgName={org.name}
      />

      {/* Legal links */}
      <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 16, paddingBottom: 40 }}>
        <a href="/privacy" className="nav-link-hover" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Privacy Policy</a>
        <a href="/terms"   className="nav-link-hover" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Terms of Service</a>
      </div>
    </div>
  );
}
