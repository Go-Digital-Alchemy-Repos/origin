import { Router } from "express";
import { createBillingRoutes, createWebhookRoute } from "./billing.routes";

export function createBillingModule(): Router {
  const router = Router();
  router.use("/billing", createBillingRoutes());
  return router;
}

export function createBillingWebhookModule(): Router {
  const router = Router();
  router.use("/", createWebhookRoute());
  return router;
}
