export interface OriginAppNavItem {
  label: string;
  path: string;
  icon: string;
  roles?: string[];
}

export interface OriginAppDefinition {
  key: string;
  name: string;
  description: string;
  version: string;
  entitlementKey: string;
  category: "core" | "addon";
  nav: OriginAppNavItem[];
  api: {
    basePath: string;
  };
  docs: {
    devDocSlug: string;
    resourceDocSlug: string;
  };
  ui: {
    baseRoute: string;
  };
  builder?: {
    components?: string[];
    widgets?: string[];
  };
  db?: {
    tables?: string[];
  };
  marketplace?: {
    itemType: "app";
    defaultBilling: "free" | "trial" | "subscription" | "one_time";
    stripePriceId?: string | null;
    trialDays?: number | null;
    isFeatured?: boolean;
  };
}

export function defineOriginApp(def: OriginAppDefinition): OriginAppDefinition {
  return def;
}
