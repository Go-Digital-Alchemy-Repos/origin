import { Router } from "express";
import { createHealthModule } from "./health";
import { createDocsModule } from "./docs";
import { createModulesModule } from "./modules";
import { createAuthModule } from "./auth";

export function registerAllModules(): Router {
  const api = Router();

  api.use(createHealthModule());
  api.use(createDocsModule());
  api.use(createModulesModule());
  api.use(createAuthModule());

  return api;
}
