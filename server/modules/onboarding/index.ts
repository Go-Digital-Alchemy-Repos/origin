import { Router } from "express";
import { onboardingRoutes } from "./onboarding.routes";

export function createOnboardingModule(): Router {
  const router = Router();
  router.use("/onboarding", onboardingRoutes());
  return router;
}
