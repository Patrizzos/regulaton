// app/api/org/invite/route.ts
// POST → generate (or regenerate) an invite token for the org
// DELETE → revoke the invite token

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const token = randomBytes(20).toString("hex");

  const org = await prisma.organization.update({
    where: { id: session.orgId },
    data:  { inviteToken: token },
  });

  return NextResponse.json({ inviteToken: org.inviteToken });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  await prisma.organization.update({
    where: { id: session.orgId },
    data:  { inviteToken: null },
  });

  return NextResponse.json({ success: true });
}
