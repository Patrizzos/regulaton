// app/api/alerts/route.ts
// PATCH { all: true } → mark all alerts as read

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.alert.updateMany({
    where: { organizationId: session.orgId, isRead: false },
    data:  { isRead: true },
  });

  return NextResponse.json({ success: true });
}
