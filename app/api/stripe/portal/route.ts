// app/api/stripe/portal/route.ts
// Creates a Stripe billing portal session so users can manage their subscription.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { isAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Only org owners and admins can manage billing." }, { status: 403 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: session.orgId },
  });

  if (!stripe) {
    return NextResponse.json({ error: "Payment processing is not configured." }, { status: 503 });
  }

  if (!subscription?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found. Please subscribe first." },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer:   subscription.stripeCustomerId,
    return_url: `${baseUrl}/settings`,
  });

  return NextResponse.json({ url: portalSession.url });
}
