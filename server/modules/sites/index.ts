import { Router } from "express";
import { createSitesRoutes } from "./sites.routes";

export function createSitesModule(): Router {
  const router = Router();
  router.use("/sites", createSitesRoutes());
  return router;
}
