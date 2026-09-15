// app/api/admin/alerts/broadcast/route.ts
// POST → push an alert to every organization in the system. Not tied to any
// customer's session — this is an internal/operator tool for things like
// announcing a regulation change (e.g. a Digital Omnibus deadline shift)
// that affects every org at once, not just one.
//
// Protected by a shared secret rather than NextAuth, since this isn't a
// customer-facing action — there's no "Regulaton staff" role in the data
// model, and building one just for this single endpoint isn't worth it yet.
// Call it with:
//   curl -X POST https://yourapp/api/admin/alerts/broadcast \
//     -H "x-admin-secret: $ADMIN_BROADCAST_SECRET" \
//     -H "Content-Type: application/json" \
//     -d '{"type":"REGULATION_UPDATE","title":"...","message":"...","actionUrl":"/learn"}'

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { AlertType } from "@prisma/client";
import { broadcastAlert } from "@/lib/alerts";

const BroadcastSchema = z.object({
  type:      z.nativeEnum(AlertType).default(AlertType.REGULATION_UPDATE),
  title:     z.string().min(1).max(200),
  message:   z.string().min(1).max(2000),
  actionUrl: z.string().optional(),
});

// Plain !== leaks how many leading characters matched via response-time
// differences (a timing attack) — timingSafeEqual compares in constant time
// regardless of where the first mismatch is. It throws on unequal-length
// buffers, so length is checked first (length alone is a far cheaper thing
// to brute-force than content, so that leak is acceptable).
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  const expected = process.env.ADMIN_BROADCAST_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_BROADCAST_SECRET is not configured on the server" },
      { status: 500 }
    );
  }
  if (!secret || !safeCompare(secret, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body   = await req.json();
  const parsed = BroadcastSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const { type, title, message, actionUrl } = parsed.data;
  const result = await broadcastAlert(type, title, message, actionUrl);

  return NextResponse.json({ success: true, organizationsNotified: result.count });
}
