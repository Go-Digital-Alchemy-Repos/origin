import { Router } from "express";
import { cmsMenusRoutes } from "./cmsMenus.routes";

export function createCmsMenusModule(): Router {
  const router = Router();
  router.use("/cms", cmsMenusRoutes());
  return router;
}
