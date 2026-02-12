import { Router } from "express";
import { cmsPagesRoutes } from "./cmsPages.routes";

export function createCmsPagesModule(): Router {
  const router = Router();
  router.use("/cms", cmsPagesRoutes());
  return router;
}
