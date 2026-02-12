import { Router } from "express";
import { marketplaceRoutes } from "./marketplace.routes";

export function createMarketplaceModule(): Router {
  const router = Router();
  router.use("/marketplace", marketplaceRoutes());
  return router;
}
