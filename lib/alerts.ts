// lib/alerts.ts
// Shared helpers for creating Alert rows. Centralized so every call site
// (tool/org changes, admin broadcasts, future scheduled jobs) creates alerts
// the same way instead of each route hand-rolling prisma.alert.create calls.

import { prisma } from "@/lib/db";
import { AlertType } from "@prisma/client";

export async function createAlert(
  organizationId: string,
  type: AlertType,
  title: string,
  message: string,
  actionUrl?: string
) {
  return prisma.alert.create({
    data: { organizationId, type, title, message, actionUrl },
  });
}

// Fan out the same alert to every organization in the system — used for
// things that affect everyone at once, like a regulation change.
export async function broadcastAlert(
  type: AlertType,
  title: string,
  message: string,
  actionUrl?: string
) {
  const orgs = await prisma.organization.findMany({ select: { id: true } });
  if (orgs.length === 0) return { count: 0 };

  const result = await prisma.alert.createMany({
    data: orgs.map((org) => ({
      organizationId: org.id,
      type,
      title,
      message,
      actionUrl,
    })),
  });

  return { count: result.count };
}
