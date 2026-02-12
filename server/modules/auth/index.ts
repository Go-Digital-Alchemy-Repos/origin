import { Router } from "express";
import { createAuthRoutes } from "./auth.routes";

export function createAuthModule(): Router {
  const router = Router();
  router.use("/user", createAuthRoutes());
  return router;
}
