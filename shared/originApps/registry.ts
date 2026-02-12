import { defineOriginApp, type OriginAppDefinition } from "./types";

const crmApp = defineOriginApp({
  key: "crm",
  name: "CRM",
  description: "Customer relationship management with leads, contacts, and notes.",
  version: "1.0.0",
  entitlementKey: "crm", // Legacy: predates apps.<key> convention
  category: "core",
  nav: [
    { label: "Leads", path: "/app/crm/leads", icon: "Contact" },
    { label: "Contacts", path: "/app/crm/contacts", icon: "Users" },
  ],
  api: { basePath: "/api/crm" },
  docs: {
    devDocSlug: "dev-app-crm",
    resourceDocSlug: "help-app-crm-suite",
  },
  ui: { baseRoute: "/app/crm" },
  db: { tables: ["crm_leads", "crm_contacts", "crm_notes"] },
  marketplace: {
    itemType: "app",
    defaultBilling: "free",
    isFeatured: false,
  },
});

const ticketsApp = defineOriginApp({
  key: "tickets",
  name: "Tickets",
  description: "Trouble ticket system for support requests, issue tracking, and customer service management.",
  version: "0.1.0",
  entitlementKey: "apps.tickets",
  category: "addon",
  nav: [
    { label: "Tickets", path: "/app/apps/tickets", icon: "Ticket" },
  ],
  api: { basePath: "/api/apps/tickets" },
  docs: {
    devDocSlug: "dev-app-tickets",
    resourceDocSlug: "help-app-tickets",
  },
  ui: { baseRoute: "/app/apps/tickets" },
  db: { tables: ["app_tickets"] },
  marketplace: {
    itemType: "app",
    defaultBilling: "free",
    isFeatured: false,
  },
});

export const appRegistry: OriginAppDefinition[] = [
  crmApp,
  ticketsApp,
];

export function getAppByKey(key: string): OriginAppDefinition | undefined {
  return appRegistry.find((a) => a.key === key);
}

export function getCoreApps(): OriginAppDefinition[] {
  return appRegistry.filter((a) => a.category === "core");
}

export function getAddonApps(): OriginAppDefinition[] {
  return appRegistry.filter((a) => a.category === "addon");
}

export { crmApp, ticketsApp };
