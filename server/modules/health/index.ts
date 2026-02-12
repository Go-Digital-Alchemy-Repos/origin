import { Router } from "express";
import { healthRoutes } from "./health.routes";

export function createHealthModule(): Router {
  const router = Router();
  router.use("/health", healthRoutes());
  return router;
}
