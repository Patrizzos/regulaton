// app/(dashboard)/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/shared/Sidebar";
import { MobileTabBar } from "@/components/shared/MobileTabBar";
import { TrialBanner } from "@/components/shared/TrialBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (!session.hasOrg)    redirect("/onboarding");

  const [org, alertCount] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: session.orgId! },
      include: { subscription: true },
    }),
    prisma.alert.count({
      where: { organizationId: session.orgId!, isRead: false },
    }),
  ]);

  if (!org) redirect("/onboarding");

  const sub = org.subscription;

  return (
    <div className="flex flex-col md:flex-row" style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar
        orgName={org.name}
        plan={sub?.plan ?? "SOLO"}
        trialEndsAt={sub?.trialEndsAt ?? null}
        unreadAlerts={alertCount}
      />
      <main
        className="px-4 py-6 md:px-10 md:py-8"
        style={{ flex: 1, minWidth: 0, paddingBottom: "calc(72px + env(safe-area-inset-bottom))" }}
      >
        <TrialBanner
          status={sub?.status ?? "TRIALING"}
          trialEndsAt={sub?.trialEndsAt ?? null}
        />
        {children}
      </main>
      <MobileTabBar unreadAlerts={alertCount} />
    </div>
  );
}
