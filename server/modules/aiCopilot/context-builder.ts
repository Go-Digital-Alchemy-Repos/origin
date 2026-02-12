import { db } from "../../db";
import { entitlements, marketplaceInstalls, marketplaceItems, pages, sites, collections, menus } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface WorkspaceContext {
  workspace: {
    id: string;
    features: string[];
    limits: Record<string, unknown>;
  };
  installedApps: Array<{
    name: string;
    slug: string;
    type: string;
    enabled: boolean;
  }>;
  sites: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    pageCount: number;
    pages: Array<{
      title: string;
      slug: string;
      status: string;
    }>;
  }>;
  collections: Array<{
    name: string;
    slug: string;
    itemCount?: number;
  }>;
  menus: Array<{
    name: string;
    slot: string | null;
  }>;
  capabilities: string[];
}

export async function buildWorkspaceContext(workspaceId: string): Promise<WorkspaceContext> {
  const [entResult, installsResult, sitesResult, collectionsResult, menusResult] = await Promise.all([
    db.select().from(entitlements).where(eq(entitlements.workspaceId, workspaceId)),
    db
      .select({
        name: marketplaceItems.name,
        slug: marketplaceItems.slug,
        type: marketplaceItems.type,
        enabled: marketplaceInstalls.enabled,
      })
      .from(marketplaceInstalls)
      .innerJoin(marketplaceItems, eq(marketplaceInstalls.itemId, marketplaceItems.id))
      .where(eq(marketplaceInstalls.workspaceId, workspaceId)),
    db.select().from(sites).where(eq(sites.workspaceId, workspaceId)),
    db.select().from(collections).where(eq(collections.workspaceId, workspaceId)),
    db.select().from(menus).where(eq(menus.workspaceId, workspaceId)),
  ]);

  const ent = entResult[0];
  const features = (ent?.features as string[]) ?? [];
  const limits = (ent?.limits as Record<string, unknown>) ?? {};

  const sitePages = await Promise.all(
    sitesResult.map(async (site) => {
      const sitePageList = await db
        .select({ title: pages.title, slug: pages.slug, status: pages.status })
        .from(pages)
        .where(and(eq(pages.siteId, site.id), eq(pages.workspaceId, workspaceId)));
      return {
        id: site.id,
        name: site.name,
        slug: site.slug,
        status: site.status,
        pageCount: sitePageList.length,
        pages: sitePageList,
      };
    }),
  );

  const capabilities = deriveCapabilities(features, installsResult);

  return {
    workspace: { id: workspaceId, features, limits },
    installedApps: installsResult,
    sites: sitePages,
    collections: collectionsResult.map((c) => ({ name: c.name, slug: c.slug })),
    menus: menusResult.map((m) => ({ name: m.name, slot: m.slot })),
    capabilities,
  };
}

const CAPABILITY_MAP: Record<string, { featureKeys: string[]; installSlugs: string[]; installTypes: string[] }> = {
  crm: { featureKeys: ["crm"], installSlugs: ["crm-suite"], installTypes: ["app"] },
  forms: { featureKeys: ["forms"], installSlugs: [], installTypes: [] },
  blog: { featureKeys: ["blog"], installSlugs: [], installTypes: [] },
  seo: { featureKeys: ["seo"], installSlugs: ["seo-toolkit-pro"], installTypes: [] },
  collections: { featureKeys: ["collections"], installSlugs: [], installTypes: [] },
  marketplace: { featureKeys: ["marketplace"], installSlugs: [], installTypes: [] },
  redirects: { featureKeys: ["redirects"], installSlugs: ["redirects-manager"], installTypes: [] },
  email: { featureKeys: ["email"], installSlugs: ["email-marketing"], installTypes: [] },
  chat: { featureKeys: ["chat"], installSlugs: ["live-chat"], installTypes: ["widget"] },
};

function deriveCapabilities(
  features: string[],
  installs: Array<{ slug: string; type: string; enabled: boolean }>,
): string[] {
  const caps: string[] = [];

  for (const [capability, mapping] of Object.entries(CAPABILITY_MAP)) {
    const hasFeature = mapping.featureKeys.some((k) => features.includes(k));
    const hasInstall = installs.some(
      (i) =>
        i.enabled &&
        (mapping.installSlugs.includes(i.slug) ||
          (mapping.installTypes.length > 0 && mapping.installTypes.includes(i.type))),
    );
    if (hasFeature || hasInstall) {
      caps.push(capability);
    }
  }

  return caps;
}
