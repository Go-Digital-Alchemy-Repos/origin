import { Router } from "express";
import { createHealthModule } from "./health";
import { createDocsModule } from "./docs";
import { createModulesModule } from "./modules";
import { createAuthModule } from "./auth";
import { createBillingModule } from "./billing";
import { createMarketplaceModule } from "./marketplace";
import { createComponentRegistryModule } from "./component-registry";
import { createCmsPagesModule } from "./cmsPages";
import { createCmsCollectionsModule } from "./cmsCollections";
import { createSiteThemeModule } from "./siteTheme";
import { createCmsMenusModule } from "./cmsMenus";
import { createFormsModule } from "./forms";
import { createRedirectsModule } from "./redirects";
import { createSeoModule } from "./seo";
import { createBlogModule } from "./blog";
import { publicSitePreviewRoutes } from "./publicSite";
import { createSiteKitsModule } from "./siteKits";
import { createCrmModule } from "./apps/crm";
import { createMigrationModule } from "./migration";

export function registerAllModules(): Router {
  const api = Router();

  api.use(createHealthModule());
  api.use(createDocsModule());
  api.use(createModulesModule());
  api.use(createAuthModule());
  api.use(createBillingModule());
  api.use(createMarketplaceModule());
  api.use(createComponentRegistryModule());
  api.use(createCmsPagesModule());
  api.use(createCmsCollectionsModule());
  api.use(createSiteThemeModule());
  api.use(createCmsMenusModule());
  api.use(createFormsModule());
  api.use(createRedirectsModule());
  api.use(createSeoModule());
  api.use(createBlogModule());
  api.use(publicSitePreviewRoutes());
  api.use(createSiteKitsModule());
  api.use(createCrmModule());
  api.use(createMigrationModule());

  return api;
}
