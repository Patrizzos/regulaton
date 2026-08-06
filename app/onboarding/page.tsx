// app/onboarding/page.tsx
// Loads the AI tool library server-side, passes to the client wizard.
// Redirects to dashboard if user already has an org.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { OnboardingWizard } from "@/components/onboarding/Wizard";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");

  // Already completed onboarding
  if (session.hasOrg) redirect("/dashboard");

  // Load full tool library for the wizard's selection step
  const libraryTools = await prisma.aIToolLibrary.findMany({
    where: { isActive: true },
    orderBy: [
      { category: "asc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      providerCompany: true,
      category: true,
      defaultRiskLevel: true,
      riskRationale: true,
      complianceNotes: true,
      logoSlug: true,
    },
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Minimal top bar */}
      <header className="px-4 py-4 sm:px-6" style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-card)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{
          fontFamily: "IBM Plex Serif, Georgia, serif",
          fontSize: 18,
          fontWeight: 600,
          color: "var(--text-primary)",
        }}>
          Regula<span style={{ color: "#059669" }}>ton</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Setup · Takes about 15 minutes
        </div>
      </header>

      {/* Wizard */}
      <div className="px-0 py-0" style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 680 }}>
          <OnboardingWizard libraryTools={libraryTools} />
        </div>
      </div>
    </div>
  );
}
