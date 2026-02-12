import type { LucideIcon } from "lucide-react";

export type OriginAppStatus = "draft" | "published" | "deprecated";

export interface OriginAppNavItem {
  title: string;
  href: string;
  icon: string;
  badge?: string;
}

export interface OriginAppDocsRef {
  devSlug: string;
  resourceSlug: string;
}

export interface OriginAppMarketplaceMeta {
  category: string;
  billingType: "free" | "subscription" | "one_time";
  price?: number;
  tagline: string;
  features: string[];
}

export interface OriginAppDefinition {
  key: string;
  name: string;
  description: string;
  version: string;
  entitlementKey: string;
  status: OriginAppStatus;
  nav: OriginAppNavItem[];
  docs: OriginAppDocsRef;
  builderComponents?: string[];
  builderWidgets?: string[];
  marketplace?: OriginAppMarketplaceMeta;
  serverRoutePrefix: string;
}

export function defineOriginApp(def: OriginAppDefinition): OriginAppDefinition {
  if (!def.key.match(/^[a-z][a-z0-9-]*$/)) {
    throw new Error(`Invalid app key "${def.key}": must be lowercase alphanumeric with hyphens`);
  }
  if (!def.version.match(/^\d+\.\d+\.\d+$/)) {
    throw new Error(`Invalid version "${def.version}": must be semver (e.g. 1.0.0)`);
  }
  if (!def.entitlementKey || def.entitlementKey.length === 0) {
    throw new Error(`entitlementKey is required`);
  }
  return Object.freeze(def);
}
