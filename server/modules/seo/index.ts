import { Router } from "express";
import { seoRoutes } from "./seo.routes";

export function createSeoModule(): Router {
  const router = Router();
  router.use("/cms", seoRoutes());
  return router;
}

export { seoService } from "./seo.service";
