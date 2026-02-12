import { Router } from "express";
import { formsRoutes } from "./forms.routes";

export function createFormsModule(): Router {
  const router = Router();
  router.use("/cms", formsRoutes());
  return router;
}
