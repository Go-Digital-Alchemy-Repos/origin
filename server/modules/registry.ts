import { Router } from "express";
import { createHealthModule } from "./health";
import { createDocsModule } from "./docs";
import { createModulesModule } from "./modules";
import { createAuthModule } from "./auth";
import { createBillingModule } from "./billing";
import { createMarketplaceModule } from "./marketplace";

export function registerAllModules(): Router {
  const api = Router();

  api.use(createHealthModule());
  api.use(createDocsModule());
  api.use(createModulesModule());
  api.use(createAuthModule());
  api.use(createBillingModule());
  api.use(createMarketplaceModule());

  return api;
}
