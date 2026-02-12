import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth, requireWorkspaceContext } from "../shared/auth-middleware";
import Stripe from "stripe";
import { z } from "zod";
import { validateBody } from "../shared/validate";
import {
  createCheckoutSession,
  createPortalSession,
  getBillingStatus,
  handleWebhookEvent,
  isStripeConfigured,
} from "./billing.service";
import { log } from "../../index";

const checkoutBody = z.object({
  plan: z.enum(["starter", "pro", "enterprise"]),
  siteQuantity: z.number().int().positive().optional().default(1),
});

export function createBillingRoutes(): Router {
  const router = Router();

  router.get("/status", requireAuth(), requireWorkspaceContext(), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.session!.activeWorkspaceId!;
      const status = await getBillingStatus(workspaceId);
      res.json({
        configured: isStripeConfigured(),
        ...status,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/checkout", requireAuth(), requireWorkspaceContext(), validateBody(checkoutBody), async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!isStripeConfigured()) {
        return res.status(503).json({ error: { message: "Stripe is not configured", code: "STRIPE_NOT_CONFIGURED" } });
      }

      const { plan, siteQuantity } = req.body;

      const workspaceId = req.session!.activeWorkspaceId!;
      const user = req.user!;

      const protocol = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;

      const session = await createCheckoutSession(
        workspaceId,
        user.email,
        user.name,
        plan,
        siteQuantity,
        `${baseUrl}/app/settings?billing=success`,
        `${baseUrl}/app/settings?billing=canceled`,
      );

      res.json({ url: session.url });
    } catch (err) {
      log(`Checkout error: ${err instanceof Error ? err.message : String(err)}`, "billing");
      next(err);
    }
  });

  router.post("/portal", requireAuth(), requireWorkspaceContext(), async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!isStripeConfigured()) {
        return res.status(503).json({ error: { message: "Stripe is not configured", code: "STRIPE_NOT_CONFIGURED" } });
      }

      const workspaceId = req.session!.activeWorkspaceId!;

      const protocol = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers.host;
      const returnUrl = `${protocol}://${host}/app/settings`;

      const session = await createPortalSession(workspaceId, returnUrl);
      res.json({ url: session.url });
    } catch (err) {
      log(`Portal error: ${err instanceof Error ? err.message : String(err)}`, "billing");
      next(err);
    }
  });

  return router;
}

export function createWebhookRoute(): Router {
  const router = Router();

  router.post("/stripe", async (req: Request, res: Response) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      log("Stripe webhook secret not configured", "billing");
      return res.status(503).json({ error: { message: "Webhook secret not configured", code: "STRIPE_NOT_CONFIGURED" } });
    }

    const sig = req.headers["stripe-signature"];
    if (!sig) {
      return res.status(400).json({ error: { message: "Missing stripe-signature header", code: "VALIDATION_ERROR" } });
    }

    let event: Stripe.Event;
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-01-27.acacia" as any });
      event = stripe.webhooks.constructEvent(req.rawBody as Buffer, sig, webhookSecret);
    } catch (err: any) {
      log(`Webhook signature verification failed: ${err.message}`, "billing");
      return res.status(400).json({ error: { message: `Webhook signature verification failed: ${err.message}`, code: "VALIDATION_ERROR" } });
    }

    try {
      await handleWebhookEvent(event);
      res.json({ received: true });
    } catch (err: any) {
      log(`Webhook handler error: ${err.message}`, "billing");
      res.status(500).json({ error: { message: "Webhook handler failed", code: "INTERNAL_ERROR" } });
    }
  });

  return router;
}
