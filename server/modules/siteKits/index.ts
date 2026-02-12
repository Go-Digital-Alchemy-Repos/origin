import { Router } from "express";
import { siteKitsRoutes } from "./siteKits.routes";

export function createSiteKitsModule(): Router {
  const router = Router();
  router.use("/site-kits", siteKitsRoutes());
  return router;
}
