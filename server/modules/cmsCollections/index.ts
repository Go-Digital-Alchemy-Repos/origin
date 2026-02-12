import { Router } from "express";
import { cmsCollectionsRoutes } from "./cmsCollections.routes";

export function createCmsCollectionsModule(): Router {
  const router = Router();
  router.use("/cms", cmsCollectionsRoutes());
  return router;
}
