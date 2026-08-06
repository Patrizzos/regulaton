// app/api/account/route.ts
// DELETE → permanently delete the current user's account and all associated data.
//
// Deletion order matters for foreign key constraints:
//   Alerts → ComplianceScore → TrainingRecords → ComplianceDocuments
//   → OrganizationAITools → Subscriptions → OrganizationMembers
//   → Organization (if last member) → Accounts → Sessions → User
//
// We use a transaction so either everything goes or nothing goes.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const orgId  = session.orgId;

  await prisma.$transaction(async (tx) => {

    // If user is the sole owner of an org, delete the entire org + its data
    if (orgId) {
      const memberCount = await tx.organizationMember.count({
        where: { organizationId: orgId },
      });

      const isOwner = session.orgRole === "OWNER";

      if (isOwner && memberCount === 1) {
        // Sole owner — delete everything under the org
        await tx.alert.deleteMany({ where: { organizationId: orgId } });
        await tx.complianceScore.deleteMany({ where: { organizationId: orgId } });
        await tx.trainingRecord.deleteMany({ where: { organizationId: orgId } });
        await tx.complianceDocument.deleteMany({ where: { organizationId: orgId } });
        await tx.organizationAITool.deleteMany({ where: { organizationId: orgId } });
        await tx.subscription.deleteMany({ where: { organizationId: orgId } });
        await tx.organizationMember.deleteMany({ where: { organizationId: orgId } });
        await tx.organization.delete({ where: { id: orgId } });
      } else {
        // Multi-member org — just remove this member
        await tx.organizationMember.deleteMany({
          where: { userId, organizationId: orgId },
        });
      }
    }

    // Delete user's auth records
    await tx.account.deleteMany({ where: { userId } });
    await tx.session.deleteMany({ where: { userId } });

    // Delete the user
    await tx.user.delete({ where: { id: userId } });
  });

  return NextResponse.json({ success: true });
}
