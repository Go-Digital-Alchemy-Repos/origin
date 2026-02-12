import { defineOriginApp, type OriginAppDefinition } from "./defineOriginApp";

const crmApp = defineOriginApp({
  key: "crm",
  name: "CRM",
  description: "Customer Relationship Management with leads, contacts, and notes tracking.",
  version: "1.0.0",
  entitlementKey: "crm",
  status: "published",
  nav: [
    { title: "Leads", href: "/app/crm/leads", icon: "Contact" },
    { title: "Contacts", href: "/app/crm/contacts", icon: "Users" },
  ],
  docs: {
    devSlug: "crm_DEV",
    resourceSlug: "crm_RESOURCE",
  },
  marketplace: {
    category: "business",
    billingType: "subscription",
    tagline: "Track leads, contacts, and notes across your workspace.",
    features: ["Lead management", "Contact management", "Notes & activity", "Lead conversion"],
  },
  serverRoutePrefix: "/crm",
});

export const originApps: OriginAppDefinition[] = [crmApp];

export function getOriginApp(key: string): OriginAppDefinition | undefined {
  return originApps.find((app) => app.key === key);
}

export function getPublishedApps(): OriginAppDefinition[] {
  return originApps.filter((app) => app.status === "published");
}

export function getEnabledAppsForWorkspace(
  entitlements: string[] | null | undefined
): OriginAppDefinition[] {
  if (!entitlements || entitlements.length === 0) return [];
  return originApps.filter(
    (app) => app.status === "published" && entitlements.includes(app.entitlementKey)
  );
}

export function getAllApps(): OriginAppDefinition[] {
  return [...originApps];
}
