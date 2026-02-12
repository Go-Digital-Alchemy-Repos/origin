import { Router } from "express";
import { createCrmModule } from "./crm";
import { createTicketsModule } from "./tickets";
import { appsRegistryRoutes } from "./apps.routes";

export function createAppsModule(): Router {
  const router = Router();
  router.use("/apps", appsRegistryRoutes());
  router.use(createCrmModule());
  router.use(createTicketsModule());
  return router;
}
