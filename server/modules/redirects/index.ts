import { Router } from "express";
import { redirectsRoutes } from "./redirects.routes";

export function createRedirectsModule(): Router {
  const router = Router();
  router.use("/cms", redirectsRoutes());
  return router;
}

export { redirectsService } from "./redirects.service";
