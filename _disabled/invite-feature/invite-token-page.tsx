// app/invite/[token]/page.tsx
// Handles team invite links. Signed-in users join immediately.
// Signed-out users are sent to login then redirected back here.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { MemberRole } from "@prisma/client";
import Link from "next/link";

interface Props { params: { token: string } }

export default async function InvitePage({ params }: Props) {
  const session = await getServerSession(authOptions);

  // Not signed in → go to login, come back after
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/invite/${params.token}`);
  }

  // Find the org by invite token
  const org = await prisma.organization.findUnique({
    where: { inviteToken: params.token },
    include: { subscription: true },
  });

  // Invalid or revoked token
  if (!org) {
    return (
      <ErrorPage
        title="Invalid invite link"
        message="This invite link is invalid or has been revoked. Ask your team admin for a new one."
      />
    );
  }

  // Already a member of this org
  const existing = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: org.id } },
  });

  if (existing) {
    redirect("/dashboard");
  }

  // Already in a different org
  if (session.hasOrg) {
    return (
      <ErrorPage
        title="Already in an organisation"
        message="You're already a member of an organisation on Regulaton. You can only belong to one organisation at a time."
      />
    );
  }

  // Add user to org as MEMBER
  await prisma.organizationMember.create({
    data: {
      userId:         session.user.id,
      organizationId: org.id,
      role:           MemberRole.MEMBER,
    },
  });

  // Redirect to dashboard — session will pick up new org on next request
  redirect("/dashboard");
}

function ErrorPage({ title, message }: { title: string; message: string }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--bg)",
      fontFamily: "Inter, sans-serif", padding: 24,
    }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
        <h1 style={{
          fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 24,
          fontWeight: 600, color: "var(--text-primary)", margin: "0 0 10px",
        }}>
          {title}
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 28px", lineHeight: 1.6 }}>
          {message}
        </p>
        <Link href="/dashboard" className="btn-dark" style={{
          display: "inline-block", padding: "10px 24px",
          background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)", borderRadius: 8,
          fontSize: 14, fontWeight: 600, textDecoration: "none",
        }}>
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
