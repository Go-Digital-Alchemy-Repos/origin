import { Router } from "express";
import { crmRoutes } from "./crm.routes";

export function createCrmModule(): Router {
  const router = Router();
  router.use("/crm", crmRoutes());
  return router;
}

export { crmService } from "./crm.service";
