import { Router } from "express";
import { docsRoutes } from "./docs.routes";

export function createDocsModule(): Router {
  const router = Router();
  router.use("/docs", docsRoutes());
  return router;
}
