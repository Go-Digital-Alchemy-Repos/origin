import { getPublishedApps, type OriginAppDefinition, type OriginAppNavItem } from "@shared/originApps";

export function getPublishedAppNavItems(entitlements: string[] | null | undefined): OriginAppNavItem[] {
  if (!entitlements || entitlements.length === 0) return [];
  const published = getPublishedApps();
  const items: OriginAppNavItem[] = [];
  for (const app of published) {
    if (entitlements.includes(app.entitlementKey)) {
      items.push(...app.nav);
    }
  }
  return items;
}

export function getPublishedAppDefinitions(): OriginAppDefinition[] {
  return getPublishedApps();
}
