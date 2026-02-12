import { Router } from "express";
import { createComponentRegistryRoutes } from "./component-registry.routes";

export function createComponentRegistryModule(): Router {
  const router = Router();
  router.use(createComponentRegistryRoutes());
  return router;
}
