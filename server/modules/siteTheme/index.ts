import { Router } from "express";
import { siteThemeRoutes } from "./siteTheme.routes";

export function createSiteThemeModule(): Router {
  const router = Router();
  router.use("/cms", siteThemeRoutes());
  return router;
}
