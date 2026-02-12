import { Router } from "express";
import { appRegistry } from "@shared/originApps";

export function appsRegistryRoutes(): Router {
  const router = Router();

  router.get("/registry", (_req, res) => {
    const apps = appRegistry.map((app) => ({
      key: app.key,
      name: app.name,
      description: app.description,
      version: app.version,
      entitlementKey: app.entitlementKey,
      category: app.category,
      nav: app.nav,
      ui: app.ui,
      docs: app.docs,
    }));
    res.json(apps);
  });

  return router;
}
