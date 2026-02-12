import { Router } from "express";
import { migrationRoutes } from "./migration.routes";

export function createMigrationModule(): Router {
  const router = Router();
  router.use(migrationRoutes());
  return router;
}
