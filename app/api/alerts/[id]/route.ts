// app/api/alerts/[id]/route.ts
// PATCH → mark a single alert as read

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const alert = await prisma.alert.findUnique({ where: { id: params.id } });
  if (!alert || alert.organizationId !== session.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.alert.update({
    where: { id: params.id },
    data:  { isRead: true },
  });

  return NextResponse.json({ success: true });
}
