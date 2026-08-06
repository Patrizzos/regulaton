// app/api/stripe/webhook/route.ts
// Handles Stripe webhook events to keep subscription state in sync.

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { Plan, SubscriptionStatus } from "@prisma/client";
import Stripe from "stripe";

// Required: disable body parsing so we can verify the raw signature
export const config = { api: { bodyParser: false } };

function stripeStatusToPrisma(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":             return SubscriptionStatus.ACTIVE;
    case "trialing":           return SubscriptionStatus.TRIALING;
    case "past_due":           return SubscriptionStatus.PAST_DUE;
    case "canceled":           return SubscriptionStatus.CANCELED;
    case "incomplete":
    case "incomplete_expired": return SubscriptionStatus.INCOMPLETE;
    default:                   return SubscriptionStatus.ACTIVE;
  }
}

async function upsertSubscription(
  stripeSubscription: Stripe.Subscription,
  orgId?: string
) {
  const resolvedOrgId = orgId ?? stripeSubscription.metadata?.orgId;
  if (!resolvedOrgId) {
    console.error("No orgId found in subscription metadata");
    return;
  }

  const plan = (stripeSubscription.metadata?.plan ?? "SOLO") as Plan;

  await prisma.subscription.upsert({
    where: { organizationId: resolvedOrgId },
    update: {
      stripeSubscriptionId: stripeSubscription.id,
      status:               stripeStatusToPrisma(stripeSubscription.status),
      plan,
      currentPeriodEnd:     new Date(stripeSubscription.current_period_end * 1000),
      canceledAt:           stripeSubscription.canceled_at
        ? new Date(stripeSubscription.canceled_at * 1000)
        : null,
    },
    create: {
      organizationId:       resolvedOrgId,
      stripeSubscriptionId: stripeSubscription.id,
      plan,
      status:               stripeStatusToPrisma(stripeSubscription.status),
      currentPeriodEnd:     new Date(stripeSubscription.current_period_end * 1000),
    },
  });
}

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new NextResponse(`Webhook error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {

      // Checkout completed → subscription created
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        if (checkoutSession.mode !== "subscription") break;

        const orgId = checkoutSession.metadata?.orgId;
        const customerId = checkoutSession.customer as string;

        // Save customer ID if not already saved
        if (orgId && customerId) {
          await prisma.subscription.updateMany({
            where: { organizationId: orgId },
            data:  { stripeCustomerId: customerId },
          });
        }

        if (checkoutSession.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            checkoutSession.subscription as string
          );
          await upsertSubscription(sub, orgId);
        }
        break;
      }

      // Subscription updated (plan change, renewal, etc.)
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscription(sub);
        break;
      }

      // Subscription cancelled
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscription(sub);
        break;
      }

      // Payment failed
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const sub = await prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        });

        if (sub) {
          await prisma.subscription.update({
            where: { stripeCustomerId: customerId },
            data:  { status: SubscriptionStatus.PAST_DUE },
          });

          // Create an alert for the org
          await prisma.alert.create({
            data: {
              organizationId: sub.organizationId,
              type:    "COMPLIANCE_RISK",
              title:   "Payment failed",
              message: "Your subscription payment failed. Update your payment method to keep access.",
              actionUrl: "/settings",
            },
          });
        }
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new NextResponse("Webhook handler error", { status: 500 });
  }

  return new NextResponse("OK", { status: 200 });
}
