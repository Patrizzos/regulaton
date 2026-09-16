// app/api/stripe/checkout/route.ts
// Creates a Stripe Checkout session and returns the URL.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe, getPriceId } from "@/lib/stripe";
import { PlanKey } from "@/lib/plans";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";

const Schema = z.object({
  plan: z.enum(["SOLO", "SMB", "BUSINESS"]),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Only org owners and admins can manage billing." }, { status: 403 });
  }

  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  if (!stripe) {
    return NextResponse.json({ error: "Payment processing is not configured." }, { status: 503 });
  }

  const plan = parsed.data.plan as PlanKey;
  const priceId = getPriceId(plan);
  if (!priceId) {
    return NextResponse.json({ error: "Plan not configured." }, { status: 503 });
  }

  // Get or create Stripe customer
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: session.orgId },
  });

  let customerId = subscription?.stripeCustomerId;

  if (!customerId) {
    const org  = await prisma.organization.findUnique({ where: { id: session.orgId } });
    const customer = await stripe.customers.create({
      email:    session.user.email!,
      name:     org?.name,
      metadata: { orgId: session.orgId, userId: session.user.id },
    });
    customerId = customer.id;

    // Save customer ID
    await prisma.subscription.upsert({
      where: { organizationId: session.orgId },
      update: { stripeCustomerId: customerId },
      create: {
        organizationId:  session.orgId,
        stripeCustomerId: customerId,
        plan,
        status: "TRIALING",
      },
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer:   customerId,
    mode:       "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/settings?upgraded=1`,
    cancel_url:  `${baseUrl}/settings`,
    metadata:    { orgId: session.orgId, plan },
    subscription_data: {
      metadata: { orgId: session.orgId, plan },
      trial_period_days: 14,
    },
    // Calculates VAT (or applies reverse-charge for verified B2B EU VAT
    // numbers) automatically at checkout, per destination-country rate.
    // Requires Stripe Tax to be turned on and your tax registrations entered
    // in the Stripe Dashboard (Settings → Tax) — this code alone doesn't make
    // you compliant, it's the mechanism that becomes correct once that's
    // configured. Until Tax is enabled in the dashboard, Stripe ignores this
    // and charges no tax.
    automatic_tax: { enabled: true },
    // Lets a business customer enter their VAT number at checkout, which
    // automatic_tax uses to apply reverse-charge (0% charged, buyer
    // self-accounts) instead of charging VAT directly — the correct outcome
    // for verified B2B sales per our earlier conversation.
    tax_id_collection: { enabled: true },
    // Prices in lib/plans.ts are the amount actually charged (VAT-exclusive);
    // automatic_tax adds tax on top rather than carving it out of this amount.
  });

  return NextResponse.json({ url: checkoutSession.url });
}
