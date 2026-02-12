import { Router } from "express";
import { modulesRoutes } from "./modules.routes";

export function createModulesModule(): Router {
  const router = Router();
  router.use("/modules", modulesRoutes());
  return router;
}
