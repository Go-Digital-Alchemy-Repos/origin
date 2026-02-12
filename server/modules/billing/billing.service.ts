import Stripe from "stripe";
import { db } from "../../db";
import { stripeCustomers, subscriptions, entitlements, workspaces } from "@shared/schema";
import { eq } from "drizzle-orm";
import { log } from "../../index";

const PLANS = {
  starter: {
    features: ["page_builder", "media_library", "seo_basic"],
    limits: { sites: 1, pages_per_site: 10, storage_gb: 1 },
  },
  pro: {
    features: ["page_builder", "media_library", "seo_toolkit", "analytics", "form_builder", "blog_engine"],
    limits: { sites: 5, pages_per_site: 100, storage_gb: 10 },
  },
  enterprise: {
    features: ["page_builder", "media_library", "seo_toolkit", "analytics", "form_builder", "blog_engine", "api_gateway", "crm", "notifications", "scheduling"],
    limits: { sites: -1, pages_per_site: -1, storage_gb: 100 },
  },
};

function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-01-27.acacia" as any });
}

export async function getOrCreateStripeCustomer(workspaceId: string, email: string, name: string) {
  const stripe = getStripeClient();
  if (!stripe) throw new Error("Stripe is not configured");

  const [existing] = await db
    .select()
    .from(stripeCustomers)
    .where(eq(stripeCustomers.workspaceId, workspaceId));

  if (existing) return existing.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { workspaceId },
  });

  await db.insert(stripeCustomers).values({
    workspaceId,
    stripeCustomerId: customer.id,
  });

  return customer.id;
}

export async function createCheckoutSession(
  workspaceId: string,
  email: string,
  workspaceName: string,
  plan: string,
  siteQuantity: number,
  successUrl: string,
  cancelUrl: string,
) {
  const stripe = getStripeClient();
  if (!stripe) throw new Error("Stripe is not configured");

  const customerId = await getOrCreateStripeCustomer(workspaceId, email, workspaceName);

  const basePriceId = process.env[`STRIPE_PRICE_${plan.toUpperCase()}_BASE`];
  const sitePriceId = process.env[`STRIPE_PRICE_${plan.toUpperCase()}_SITE`];

  if (!basePriceId) {
    throw new Error(`No Stripe price configured for plan: ${plan}`);
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    { price: basePriceId, quantity: 1 },
  ];

  if (sitePriceId && siteQuantity > 0) {
    lineItems.push({ price: sitePriceId, quantity: siteQuantity });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { workspaceId, plan },
    subscription_data: {
      metadata: { workspaceId, plan },
    },
  });

  return session;
}

export async function createPortalSession(workspaceId: string, returnUrl: string) {
  const stripe = getStripeClient();
  if (!stripe) throw new Error("Stripe is not configured");

  const [customer] = await db
    .select()
    .from(stripeCustomers)
    .where(eq(stripeCustomers.workspaceId, workspaceId));

  if (!customer) throw new Error("No Stripe customer found for this workspace");

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripeCustomerId,
    return_url: returnUrl,
  });

  return session;
}

export async function getSubscription(workspaceId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.workspaceId, workspaceId));
  return sub ?? null;
}

export async function getEntitlement(workspaceId: string) {
  const [ent] = await db
    .select()
    .from(entitlements)
    .where(eq(entitlements.workspaceId, workspaceId));
  return ent ?? null;
}

export async function getBillingStatus(workspaceId: string) {
  const sub = await getSubscription(workspaceId);
  const ent = await getEntitlement(workspaceId);
  const [customer] = await db
    .select()
    .from(stripeCustomers)
    .where(eq(stripeCustomers.workspaceId, workspaceId));

  return {
    subscription: sub,
    entitlement: ent,
    hasStripeCustomer: !!customer,
  };
}

function upsertEntitlements(workspaceId: string, plan: string) {
  const planConfig = PLANS[plan as keyof typeof PLANS] || PLANS.starter;

  return db
    .insert(entitlements)
    .values({
      workspaceId,
      features: planConfig.features,
      limits: planConfig.limits,
    })
    .onConflictDoUpdate({
      target: entitlements.workspaceId,
      set: {
        features: planConfig.features,
        limits: planConfig.limits,
        updatedAt: new Date(),
      },
    });
}

export async function handleWebhookEvent(event: Stripe.Event) {
  log(`Processing webhook event: ${event.type}`, "billing");

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;
      const plan = session.metadata?.plan || "starter";
      if (!workspaceId || !session.subscription) break;

      const stripe = getStripeClient()!;
      const sub = await stripe.subscriptions.retrieve(session.subscription as string);

      let siteQuantity = 1;
      for (const item of sub.items.data) {
        if (item.price.id === process.env[`STRIPE_PRICE_${plan.toUpperCase()}_SITE`]) {
          siteQuantity = item.quantity || 1;
        }
      }

      await db
        .insert(subscriptions)
        .values({
          workspaceId,
          stripeSubscriptionId: sub.id,
          status: sub.status,
          plan,
          siteQuantity,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        })
        .onConflictDoUpdate({
          target: subscriptions.workspaceId,
          set: {
            stripeSubscriptionId: sub.id,
            status: sub.status,
            plan,
            siteQuantity,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            updatedAt: new Date(),
          },
        });

      await upsertEntitlements(workspaceId, plan);
      await db.update(workspaces).set({ plan }).where(eq(workspaces.id, workspaceId));

      log(`Subscription activated for workspace ${workspaceId}: ${plan}`, "billing");
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const workspaceId = sub.metadata?.workspaceId;
      if (!workspaceId) break;

      const plan = sub.metadata?.plan || "starter";
      let siteQuantity = 1;
      for (const item of sub.items.data) {
        if (item.price.id === process.env[`STRIPE_PRICE_${plan.toUpperCase()}_SITE`]) {
          siteQuantity = item.quantity || 1;
        }
      }

      await db
        .update(subscriptions)
        .set({
          status: sub.status,
          plan,
          siteQuantity,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.workspaceId, workspaceId));

      await upsertEntitlements(workspaceId, plan);
      await db.update(workspaces).set({ plan }).where(eq(workspaces.id, workspaceId));

      log(`Subscription updated for workspace ${workspaceId}: ${sub.status}`, "billing");
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const workspaceId = sub.metadata?.workspaceId;
      if (!workspaceId) break;

      await db
        .update(subscriptions)
        .set({ status: "canceled", cancelAtPeriodEnd: false, updatedAt: new Date() })
        .where(eq(subscriptions.workspaceId, workspaceId));

      await upsertEntitlements(workspaceId, "starter");
      await db.update(workspaces).set({ plan: "starter" }).where(eq(workspaces.id, workspaceId));

      log(`Subscription canceled for workspace ${workspaceId}`, "billing");
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.subscription as string;
      if (!subId) break;

      await db
        .update(subscriptions)
        .set({ status: "past_due", updatedAt: new Date() })
        .where(eq(subscriptions.stripeSubscriptionId, subId));

      log(`Payment failed for subscription ${subId}`, "billing");
      break;
    }

    default:
      log(`Unhandled webhook event: ${event.type}`, "billing");
  }
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
